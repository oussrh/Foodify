"""One dish, end to end: capture -> frames -> COLMAP -> metric mesh -> texture -> GLB + USDZ."""

import json
import time
import traceback
from dataclasses import asdict
from pathlib import Path

import open3d as o3d

from . import frames, masks, mesh, orbit, preflight, sfm, views
from .asset import build_asset, settle
from .params import Params

__all__ = ["Params", "STAGES", "build_asset", "run"]


def _warnings(report: dict, p: Params) -> list[str]:
    """What a reviewer should look at before accepting the dish."""
    found = list(report.get("check", {}).get("warnings", [])) + list(report.get("frames", {}).get("warnings", []))
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


def _segmenter():
    """The dish segmentation model, or None where it is not installed (a bare command-line run):
    the upload check then judges sharpness and light only."""
    try:
        return masks.load()
    except RuntimeError:
        return None


def _prepare(source: Path, work: Path, p: Params, report: dict):
    """The frames, and in turntable mode the dish cut out of each; returns the model that cuts."""
    report["frames"] = frames.prepare_images(source, work / "images", work / "candidates", p.frames)
    if p.mode != "turntable":
        return None
    predict = masks.load()
    share = masks.write_masks(work / "images", masks.image_names(work / "images"), work / "masks", predict)
    report["masks"] = {"dish_share": round(share, 3)}
    if share < 0.01:
        raise orbit.CaptureError("The dish could not be told apart from the room; film it on a plain, uncluttered table")
    return predict


def _poses(work: Path, p: Params, report: dict, log: Path, masked: bool) -> dict:
    poses = sfm.sparse(work / "images", work / "colmap", p.mapper, log, work / "masks" if masked else None)
    report["colmap"] = {"models": poses["models"], "registered": poses["registered"],
                        "registered_ratio": round(poses["registered"] / report["frames"]["kept"], 3),
                        "stills_registered": sum(n.startswith("stills/") for n in poses["names"])}
    report["colmap"]["view_spread_deg"] = round(orbit.check_motion(poses["dirs"], p.mode), 1)
    return poses


def _align(fused: Path, poses: dict, p: Params):
    dense = o3d.io.read_point_cloud(str(fused))
    if p.mode == "turntable":
        up = orbit.turn_axis(poses["centres"], poses["dirs"], poses["names"])
        return mesh.align_turntable(dense, poses["centres"], up, p.plate_cm / 100, p.crop_margin)
    return mesh.align_and_scale(dense, poses["centres"], poses["dirs"], p.plate_cm / 100, p.crop_margin)


def _views(work: Path, poses: dict, alignment: dict, predict, log: Path) -> list:
    """The images dense stereo used, as cameras in the dish's frame, to paint the texture from,
    with the dish outlined in each (in either mode: the labels and the hull need it)."""
    predict = predict or _segmenter()
    names = (work / "colmap" / "dense_images.txt").read_text().splitlines()
    loaded = views.load(work / "images", poses["model"], [n for n in names if n], work / "colmap",
                        alignment["transform"], log)
    if predict:
        views.add_masks(loaded, predict)
    return loaded


def _reconstruct(source: Path, work: Path, out: Path, p: Params, report: dict, timed) -> None:
    log = out / "colmap.log"
    report["colmap_version"] = sfm.colmap_version()
    report["check"] = timed("check", lambda: preflight.check(source, p.mode, _segmenter()))
    predict = timed("frames", lambda: _prepare(source, work, p, report))
    poses = timed("sparse", lambda: _poses(work, p, report, log, predict is not None))
    # Fusion keeps the dish's own edge: a grown one bakes the turntable onto the plate's rim.
    cut = (lambda images, names, target: masks.write_masks(images, names, target, predict, grow=0)) if predict else None
    fused = timed("dense", lambda: sfm.dense(work / "images", poses, work / "colmap", p.dense_size,
                                             p.dense_views, log, cut))
    cloud, report["alignment"] = timed("align", lambda: settle(*_align(fused, poses, p)))
    if p.debug:
        o3d.io.write_point_cloud(str(out / "dense_cropped.ply"), cloud)
    report["asset"] = timed("mesh_texture_export", lambda: build_asset(
        cloud, report["alignment"], out, p, _views(work, poses, report["alignment"], predict, log)))


STAGES = ["check", "frames", "sparse", "dense", "align", "mesh_texture_export"]


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
        # What to film differently is said as it is; anything else names its kind, for us.
        report["error"] = str(exc) if isinstance(exc, orbit.CaptureError) else f"{type(exc).__name__}: {exc}"
        (out / "traceback.txt").write_text(traceback.format_exc())  # for us; the report is for the manager

    report["warnings"] = _warnings(report, p)
    report["seconds"]["total"] = round(sum(report["seconds"].values()), 1)
    report["outputs"] = sorted({*(f.name for f in out.iterdir() if f.is_file()), "report.json"})
    (out / "report.json").write_text(json.dumps(report, indent=2))
    return report
