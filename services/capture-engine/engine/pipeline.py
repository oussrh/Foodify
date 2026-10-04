"""One dish, end to end: capture -> frames -> COLMAP -> metric mesh -> texture -> GLB + USDZ."""

import json
import time
import traceback
from dataclasses import asdict, dataclass
from pathlib import Path

import cv2
import numpy as np
import open3d as o3d

from . import base, export, frames, mesh, sfm, texture


@dataclass
class Params:
    plate_cm: float = 27.0         # diameter of the plate; sets the real-world size
    frames: int = 150              # frames kept for reconstruction
    mapper: str = "incremental"    # incremental | global (faster, try it in the bake-off)
    dense_views: int = 75          # frames dense stereo runs on (the slowest stage), evenly spaced
    dense_size: int = 1200         # long edge of the images dense stereo works on
    triangles: int = 50_000        # Scene Viewer's ideal is 30-50k
    texture_size: int = 2048       # Scene Viewer's maximum
    crop_margin: float = 1.06      # crop radius, as a multiple of the detected dish radius
    roughness: float = 0.6
    base_logo: str = ""            # underside: logo file or URL (PNG/JPEG), centred
    base_text: str = ""            # underside: restaurant name, used when there is no logo
    base_color: str = ""           # underside colour as #rrggbb; default: the plate's rim colour
    debug: bool = False           # also write the cropped dense cloud and the full-resolution mesh


def _unit(normals: np.ndarray) -> np.ndarray:
    length = np.linalg.norm(normals, axis=1, keepdims=True)
    return np.where(length > 1e-8, normals / np.maximum(length, 1e-8), [0.0, 1.0, 0.0])


def _compact(vertices: np.ndarray, normals: np.ndarray, faces: np.ndarray):
    """The vertices a subset of faces uses, with the faces re-indexed onto them."""
    used, inverse = np.unique(faces, return_inverse=True)
    return vertices[used], normals[used], inverse.reshape(-1, 3)


def _dish_part(v, n, f, cloud, out: Path, p: Params) -> tuple[export.Part, float]:
    v, n, f = _compact(v, n, f)
    vmap, faces, uvs = texture.unwrap(v, f, p.texture_size)
    positions = v[vmap]
    image, coverage = texture.bake(positions, faces, uvs, np.asarray(cloud.points),
                                   np.asarray(cloud.colors), p.texture_size)
    path = out / "texture.jpg"
    cv2.imwrite(str(path), cv2.cvtColor(image, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
    return export.Part("Dish", positions, _unit(n[vmap]), uvs, faces, path, p.roughness), coverage


def _base_part(v, n, f, cloud, radius_m: float, out: Path, p: Params) -> tuple[export.Part, dict]:
    v, _, f = _compact(v, n, f)
    color = base.parse_color(p.base_color) or base.plate_color(
        np.asarray(cloud.points), np.asarray(cloud.colors), radius_m)
    img, shows, notes = base.image(1024, color, p.base_logo, p.base_text)
    path = out / "base.jpg"
    img.save(path, quality=92)
    part = export.Part("Base", v, np.tile([0.0, -1.0, 0.0], (len(v), 1)), base.uvs(v, radius_m), f, path, 0.8)
    return part, {"faces": int(len(f)), "shows": shows, "color": "#%02x%02x%02x" % tuple(
        int(round(c * 255)) for c in color), "notes": notes}


def build_asset(cloud: o3d.geometry.PointCloud, alignment: dict, out: Path, p: Params) -> dict:
    """Metric, cropped point cloud -> dish.glb + dish.usdz (+ texture.jpg, base.jpg)."""
    high = mesh.surface(cloud, alignment["dish_radius_m"], alignment["crop_radius_m"])
    low = mesh.simplify(high, p.triangles)
    low.compute_triangle_normals()
    v, f, n = np.asarray(low.vertices), np.asarray(low.triangles), np.asarray(low.vertex_normals)
    under = base.faces(v, f, np.asarray(low.triangle_normals))

    dish, coverage = _dish_part(v, n, f[~under], cloud, out, p)
    parts, base_info = [dish], None
    if under.any():
        base_part, base_info = _base_part(v, n, f[under], cloud, alignment["dish_radius_m"], out, p)
        parts.append(base_part)
    export.write_glb(out / "dish.glb", parts)
    export.write_usdz(out / "dish.usdz", parts)
    if p.debug:
        o3d.io.write_triangle_mesh(str(out / "mesh_highres.ply"), high)

    positions = np.concatenate([part.positions for part in parts])
    size = positions.max(axis=0) - positions.min(axis=0)
    return {
        "triangles": int(sum(len(part.faces) for part in parts)),
        "vertices": int(sum(len(part.positions) for part in parts)),
        "base": base_info,
        "watertight": bool(low.is_watertight()),
        "size_cm": {"width": round(size[0] * 100, 1), "height": round(size[1] * 100, 1),
                    "depth": round(size[2] * 100, 1)},
        "texture_coverage": round(coverage, 3),
        "glb_mb": round((out / "dish.glb").stat().st_size / 1e6, 2),
        "usdz_mb": round((out / "dish.usdz").stat().st_size / 1e6, 2),
        "usdz_issues": export.check_usdz(out / "dish.usdz"),
    }


def _warnings(report: dict, p: Params) -> list[str]:
    """What a reviewer should look at before accepting the dish."""
    found = list(report.get("frames", {}).get("warnings", []))
    ratio = report.get("colmap", {}).get("registered_ratio")
    if ratio is not None and ratio < 0.8:
        found.append(f"only {ratio:.0%} of the frames were placed; expect holes (blur, a plain table, or too fast)")
    stills, placed = report.get("frames", {}).get("stills", 0), report.get("colmap", {}).get("stills_registered")
    if placed is not None and placed < stills:
        found.append(f"{stills - placed} of the {stills} photos could not be placed; take them from where the video went, with the whole plate in view")
    asset = report.get("asset")
    if asset:
        width = max(asset["size_cm"]["width"], asset["size_cm"]["depth"])
        if abs(width - p.plate_cm) > 0.12 * p.plate_cm:
            found.append(f"model is {width} cm across for a {p.plate_cm} cm plate; check the crop")
        if asset["glb_mb"] > 5:
            found.append(f"GLB is {asset['glb_mb']} MB; the target is 5 MB or less")
        if asset["usdz_issues"]:
            found.append(f"USDZ validation: {len(asset['usdz_issues'])} issue(s)")
        if asset["base"] is None:
            found.append("no flat base found under the plate; the underside is not branded")
        else:
            found += asset["base"]["notes"]
    return found


def _reconstruct(source: Path, work: Path, out: Path, p: Params, report: dict, timed) -> None:
    log = out / "colmap.log"
    report["colmap_version"] = sfm.colmap_version()
    report["frames"] = timed("frames", lambda: frames.prepare_images(
        source, work / "images", work / "candidates", p.frames))
    poses = timed("sparse", lambda: sfm.sparse(work / "images", work / "colmap", p.mapper, log))
    report["colmap"] = {"models": poses["models"], "registered": poses["registered"],
                        "registered_ratio": round(poses["registered"] / report["frames"]["kept"], 3),
                        "stills_registered": sum(n.startswith("stills/") for n in poses["names"])}
    fused = timed("dense", lambda: sfm.dense(work / "images", poses, work / "colmap", p.dense_size,
                                             p.dense_views, log))

    dense = o3d.io.read_point_cloud(str(fused))
    cloud, report["alignment"] = timed("align", lambda: mesh.align_and_scale(
        dense, poses["centres"], poses["dirs"], p.plate_cm / 100, p.crop_margin))
    if p.debug:
        o3d.io.write_point_cloud(str(out / "dense_cropped.ply"), cloud)
    report["asset"] = timed("mesh_texture_export", lambda: build_asset(cloud, report["alignment"], out, p))


STAGES = ["frames", "sparse", "dense", "align", "mesh_texture_export"]


def run(source: Path, job_dir: Path, p: Params, on_stage=None) -> dict:
    """Process one capture. `on_stage(name)` is called as each of STAGES begins."""
    out, work = job_dir / "output", job_dir / "work"
    out.mkdir(parents=True, exist_ok=True)
    report: dict = {"source": source.name, "params": asdict(p), "seconds": {}}

    def timed(name, fn):
        if on_stage:
            on_stage(name)
        start = time.time()
        result = fn()
        report["seconds"][name] = round(time.time() - start, 1)
        return result

    try:
        _reconstruct(source, work, out, p, report, timed)
        report["status"] = "ok"
    except Exception as exc:  # the report is the product of a failed job too
        report["status"] = "failed"
        report["error"] = f"{type(exc).__name__}: {exc}"
        (out / "traceback.txt").write_text(traceback.format_exc())  # for us; the report is for the manager

    report["warnings"] = _warnings(report, p)
    report["seconds"]["total"] = round(sum(report["seconds"].values()), 1)
    report["outputs"] = sorted({*(f.name for f in out.iterdir() if f.is_file()), "report.json"})
    (out / "report.json").write_text(json.dumps(report, indent=2))
    return report
