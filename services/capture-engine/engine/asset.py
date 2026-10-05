"""From the dish's metric, cropped point cloud to the files: dish.glb, dish.usdz, texture.jpg,
base.jpg.

The shape: on a round plate, the fitted plate (plate.py) with the food meshed on it; otherwise
the whole dish meshed from the points (mesh.surface). The colour: painted from the photos and
frames when there are views (paint.py), from the points when there are none (the smoke test).
The flat foot facing down is its own part, branded (base.py).
"""

from pathlib import Path

import cv2
import numpy as np
import open3d as o3d

from . import base, export, hull, labels, mesh, paint, plate, texture
from .params import Params
from .views import View


def _unit(normals: np.ndarray) -> np.ndarray:
    length = np.linalg.norm(normals, axis=1, keepdims=True)
    return np.where(length > 1e-8, normals / np.maximum(length, 1e-8), [0.0, 1.0, 0.0])


def _compact(vertices: np.ndarray, normals: np.ndarray, faces: np.ndarray):
    """The vertices a subset of faces uses, with the faces re-indexed onto them."""
    used, inverse = np.unique(faces, return_inverse=True)
    return vertices[used], normals[used], inverse.reshape(-1, 3)


def settle(cloud: o3d.geometry.PointCloud, alignment: dict) -> tuple[o3d.geometry.PointCloud, dict]:
    """A round plate levelled on its own rim and stood on y = 0 (plate.settle), the alignment's
    transform updated to match so the views still line up; unchanged when there is no round plate."""
    found = plate.settle(cloud, alignment["dish_radius_m"])
    if found is None:
        return cloud, alignment
    rot, centre, factor = found
    out = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(factor * (np.asarray(cloud.points) @ rot.T - centre)))
    out.colors = cloud.colors
    if cloud.has_normals():
        out.normals = o3d.utility.Vector3dVector(np.asarray(cloud.normals) @ rot.T)
    # local = s (R x + o)  ->  local' = factor (rot local - centre) = (factor s)(rot R x + rot o - centre / s)
    t = alignment["transform"]
    scale = factor * t["scale"]
    rotation, offset = rot @ np.array(t["rotation"]), rot @ np.array(t["offset"]) - centre / t["scale"]
    tilt = float(np.degrees(np.arccos(np.clip(rot[1, 1], -1, 1))))
    return out, {**alignment, "transform": {"rotation": rotation.tolist(), "offset": offset.tolist(), "scale": scale},
                 "scale": alignment.get("scale", t["scale"]) * factor, "levelled_deg": round(tilt, 2),
                 "recentred_mm": round(float(np.hypot(centre[0], centre[2])) * 1000, 1), "rescaled": round(factor, 4)}


def _shape(cloud: o3d.geometry.PointCloud, alignment: dict, p: Params, views: list[View]):
    """(low-poly mesh, full-resolution mesh for debugging, what the plate came to)."""
    radius = alignment["dish_radius_m"]
    fitted = plate.fit(np.asarray(cloud.points), radius)
    if fitted is None:
        high = mesh.surface(cloud, radius, alignment["crop_radius_m"])
        return mesh.simplify(high, p.triangles), high, {"fitted": False, "faces": 0}
    solid = plate.solid(fitted)
    pts = np.asarray(cloud.points)
    food_pts = pts[plate.food(pts, fitted)]
    segment = labels.load() if views else None
    if segment is not None:
        labels.label(views, fitted, food_pts, segment)
    filled = hull.fill(views, food_pts, fitted)
    food = plate.food_surface(cloud, fitted, filled)
    info = {"fitted": True, "floor_mm": round(float(fitted.h[0]) * 1000, 1),
            "rim_mm": round(float(fitted.h.max()) * 1000, 1), "food": food is not None, "hull_points": len(filled[0]),
            "labelled": segment is not None, "faces": len(solid.triangles)}  # the solid's faces come first in the merged mesh
    if food is None:
        return solid, solid, info
    low = mesh.simplify(food, max(p.triangles - len(solid.triangles), 1000))
    return solid + low, solid + food, info


PLATE_TEXTURE = 1024  # the plate's own texture: a plate is mostly plain, the food gets the large one


def _textured(name: str, file: str, size: int, v, n, f, on_plate: bool, whole, cloud, views: list[View],
              out: Path, p: Params) -> tuple[export.Part, float, float]:
    """One textured part (`f` of the mesh `v`, `n`), painted against the `whole` model (positions,
    faces), so the parts still hide one another: (part, texture coverage, share painted from views)."""
    v, n, f = _compact(v, n, f)
    vmap, faces, uvs = texture.unwrap(v, f, size)
    positions, normals = v[vmap], _unit(n[vmap])
    if views:
        flags = np.full(len(faces), on_plate) if on_plate or whole is not None else None
        image, coverage, painted = paint.paint(positions, normals, faces, uvs, size, views, cloud, flags, whole)
    else:
        image, coverage = texture.bake(positions, faces, uvs, np.asarray(cloud.points), np.asarray(cloud.colors), size)
        painted = 0.0
    path = out / file
    cv2.imwrite(str(path), cv2.cvtColor(image, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90])
    return export.Part(name, positions, normals, uvs, faces, path, p.roughness), coverage, painted


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


def build_asset(cloud: o3d.geometry.PointCloud, alignment: dict, out: Path, p: Params,
                views: list[View] | None = None) -> dict:
    """Metric, cropped point cloud -> dish.glb + dish.usdz (+ texture.jpg, and plate.jpg and
    base.jpg when the plate is fitted and its foot found). With a fitted plate the food and the plate
    are separate parts, each with its own texture: the food gets the whole of the large one."""
    low, high, plate_info = _shape(cloud, alignment, p, views or [])
    low.compute_vertex_normals()
    low.compute_triangle_normals()
    v, f, n = np.asarray(low.vertices), np.asarray(low.triangles), np.asarray(low.vertex_normals)
    under = base.faces(v, f, np.asarray(low.triangle_normals))

    on_plate = np.arange(len(f)) < plate_info.pop("faces")
    whole = (v, f) if on_plate.any() else None
    dish, coverage, painted = _textured("Dish", "texture.jpg", p.texture_size, v, n, f[~under & ~on_plate],
                                        False, whole, cloud, views or [], out, p)
    parts, base_info = [dish], None
    if (on_plate & ~under).any():
        plate_part, _, _ = _textured("Plate", "plate.jpg", PLATE_TEXTURE, v, n, f[on_plate & ~under],
                                     True, whole, cloud, views or [], out, p)
        parts.append(plate_part)
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
        "plate": plate_info,
        "base": base_info,
        "watertight": bool(low.is_watertight()),
        "size_cm": {"width": round(size[0] * 100, 1), "height": round(size[1] * 100, 1),
                    "depth": round(size[2] * 100, 1)},
        "texture_coverage": round(coverage, 3),
        "texture_painted": round(painted, 3),
        "glb_mb": round((out / "dish.glb").stat().st_size / 1e6, 2),
        "usdz_mb": round((out / "dish.usdz").stat().st_size / 1e6, 2),
        "usdz_issues": export.check_usdz(out / "dish.usdz"),
    }
