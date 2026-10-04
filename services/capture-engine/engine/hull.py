"""Where stereo saw nothing, the food's outline in every view says where it can be (a visual hull).

Stereo needs a surface seen from two sides with texture on it; the shaded space under food that
overhangs, or the dark side of a bun, gives it none, and the mesh there grew stalks or holes. The
segmentation masks (masks.py) outline the dish in each view, and the labels (labels.py) say which
of it is plate. A point of space is not food when, in two views or more, it falls outside the
dish's outline, or on the plate in front of it: there the plate would have been seen behind it,
so the point is air. A point the plate's rim hides is no evidence either way. Carving a grid of
such points leaves the food's envelope, used only where no measured point is near.
"""

import numpy as np
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree

from .plate import Plate, footprint
from .views import View

STEP = 0.002  # 2 mm voxels


def _behind_rim(view: View, pts: np.ndarray, plate: Plate) -> np.ndarray:
    """Points whose line of sight crosses the rim's circle below the rim's top: hidden by it."""
    c = view.centre
    d = pts - c
    a = d[:, 0] ** 2 + d[:, 2] ** 2
    b = 2 * (c[0] * d[:, 0] + c[2] * d[:, 2])
    cc = c[0] ** 2 + c[2] ** 2 - plate.radius ** 2
    disc = b * b - 4 * a * cc
    t = (-b - np.sqrt(np.maximum(disc, 0))) / np.maximum(2 * a, 1e-12)  # where the line enters the circle
    crossing = (disc > 0) & (t > 0) & (t < 1)
    return crossing & (c[1] + t * d[:, 1] < float(plate.h.max()) + 0.001)


def _carve(views: list[View], plate: Plate, xs, ys, zs) -> np.ndarray:
    """Occupancy of the grid: not ruled out by two views or more."""
    gx, gy, gz = np.meshgrid(xs, ys, zs, indexing="ij")
    pts = np.column_stack([gx.ravel(), gy.ravel(), gz.ravel()])
    against = np.zeros(len(pts), np.int16)
    for view in views:
        if view.mask is None:
            continue
        fx, fy, cx, cy = view.k
        cam = pts @ view.rotation.T + view.translation
        z = np.maximum(cam[:, 2], 1e-9)
        u, v = (fx * cam[:, 0] / z + cx).astype(int), (fy * cam[:, 1] / z + cy).astype(int)
        h, w = view.mask.shape
        seen = (cam[:, 2] > 0) & (u >= 0) & (v >= 0) & (u < w) & (v < h)
        out = np.zeros(len(pts), bool)
        out[seen] = ~view.mask[v[seen], u[seen]]
        if view.plate is not None:
            on_plate = np.zeros(len(pts), bool)
            on_plate[seen] = view.plate[v[seen], u[seen]]
            out |= on_plate & ~_behind_rim(view, pts, plate)
        against += out
    return (against < 2).reshape(gx.shape)


def fill(views: list[View], food_points: np.ndarray, plate: Plate) -> tuple[np.ndarray, np.ndarray]:
    """(points, outward normals) of the hull's surface under the food, where no food point is within
    5 mm: the parts stereo missed. Nothing at or below the plate, nor outside the food's footprint
    seen from above (plate.footprint)."""
    if not food_points.size or not any(v.mask is not None for v in views):
        return np.empty((0, 3)), np.empty((0, 3))
    radius = plate.radius
    xs = np.arange(-radius, radius, STEP)
    ys = np.arange(0.0, food_points[:, 1].max() + 0.01, STEP)
    occupied = _carve(views, plate, xs, ys, xs)
    smooth = gaussian_filter(occupied.astype(np.float32), 1.0)
    surface = occupied & (gaussian_filter(occupied.astype(np.float32), 0.7) < 0.9)
    i, j, k = np.nonzero(surface)
    pts = np.column_stack([xs[i], ys[j], xs[k]])
    grad = np.stack(np.gradient(smooth), axis=-1)[i, j, k]
    normals = -grad / np.maximum(np.linalg.norm(grad, axis=1, keepdims=True), 1e-9)

    r = np.hypot(pts[:, 0], pts[:, 2])
    near, _ = cKDTree(food_points).query(pts, distance_upper_bound=0.005)
    under = footprint(food_points, radius)(pts[:, [0, 2]])
    keep = (pts[:, 1] > plate.height(r) + 0.002) & ~np.isfinite(near) & under & (r < 0.98 * radius)
    return pts[keep], normals[keep]
