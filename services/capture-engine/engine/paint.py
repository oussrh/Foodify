"""The texture painted from the photos and frames, not from the dense points.

Dense points are a few per square millimetre and blur whatever is printed or plated; the images
are sharp. For each texel: the views that see its point unobstructed (a ray test against the mesh
itself), facing it and in front of it; of those the five best (square on, close, an HD photo
counting double), and of these the ones that agree: a sample far from the texel's median colour
is a view that saw something else there or a highlight, and is dropped; the rest are averaged.
Texels no view sees take the dense points' colour.

With a fitted plate and the views labelled (labels.py), the plate is painted only from pixels that
are plate and the food only from pixels that are not: a view where the food stands in front of
the plate (an overhang, an underside stereo never measured) no longer paints the food onto it.
Plate texels left without agreeing views (under the food) take their ring's colour: the median of
the agreeing texels at the same distance from the centre. A patterned plate keeps the pattern it
showed.
"""

import numpy as np
import open3d as o3d

from . import texture
from .views import View

STEP = 4      # depth is tested on every 4th pixel's ray, then compared with a margin
KEEP = 5      # best views considered per texel
AGREE = 0.12  # a sample further than this from the median colour (mean of |RGB|, 0-1) is dropped


def _depths(scene: o3d.t.geometry.RaycastingScene, view: View) -> np.ndarray:
    """Distance to the mesh along every STEP-th pixel's ray, eroded so edges count as hidden."""
    import cv2

    h, w = view.image.shape[:2]
    fx, fy, cx, cy = view.k
    us, vs = np.meshgrid(np.arange(0, w, STEP) + 0.5, np.arange(0, h, STEP) + 0.5)
    d = np.stack([(us - cx) / fx, (vs - cy) / fy, np.ones_like(us)], axis=-1) @ view.rotation
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    rays = np.concatenate([np.broadcast_to(view.centre, d.shape), d], axis=-1).astype(np.float32)
    hit = scene.cast_rays(o3d.core.Tensor(rays))["t_hit"].numpy()
    return cv2.erode(np.where(np.isfinite(hit), hit, 1e3).astype(np.float32), np.ones((3, 3), np.uint8))


def _sample(view: View, points: np.ndarray, normals: np.ndarray, depth: np.ndarray,
            on_plate: np.ndarray | None = None):
    """(weight, RGB) of every point in this view; weight 0 where it is not seen, or where the
    view's label at that pixel (plate or not) is not the point's."""
    fx, fy, cx, cy = view.k
    cam = points @ view.rotation.T + view.translation
    to_cam = view.centre - points
    dist = np.linalg.norm(to_cam, axis=1)
    facing = (normals * to_cam).sum(axis=1) / np.maximum(dist, 1e-9)
    z = np.maximum(cam[:, 2], 1e-9)
    u, v = fx * cam[:, 0] / z + cx, fy * cam[:, 1] / z + cy
    h, w = view.image.shape[:2]
    ok = (cam[:, 2] > 0) & (facing > 0.15) & (u >= 1) & (v >= 1) & (u < w - 2) & (v < h - 2)
    gi = np.clip((v / STEP).astype(int), 0, depth.shape[0] - 1)
    gj = np.clip((u / STEP).astype(int), 0, depth.shape[1] - 1)
    ok &= dist <= depth[gi, gj] + 0.002 + 0.004 * dist
    pi, pj = np.clip(v.astype(int), 0, h - 1), np.clip(u.astype(int), 0, w - 1)
    if view.mask is not None:
        ok &= view.mask[pi, pj]
    if view.plate is not None and on_plate is not None:
        ok &= view.plate[pi, pj] == on_plate
    weight = np.where(ok, facing ** 2 / np.maximum(dist, 1e-3) ** 2 * (2.0 if view.still else 1.0), 0.0)
    rgb = np.zeros((len(points), 3), np.float32)
    rgb[ok] = _bilinear(view.image, u[ok], v[ok])
    return weight, rgb


def _bilinear(image: np.ndarray, u: np.ndarray, v: np.ndarray) -> np.ndarray:
    x0, y0 = np.floor(u - 0.5).astype(int), np.floor(v - 0.5).astype(int)
    fx, fy = (u - 0.5 - x0)[:, None], (v - 0.5 - y0)[:, None]
    px = lambda y, x: image[y, x].astype(np.float32)
    top = px(y0, x0) * (1 - fx) + px(y0, x0 + 1) * fx
    bottom = px(y0 + 1, x0) * (1 - fx) + px(y0 + 1, x0 + 1) * fx
    return (top * (1 - fy) + bottom * fy) / 255.0


def _keep_best(best_w: np.ndarray, best_c: np.ndarray, weight: np.ndarray, rgb: np.ndarray) -> None:
    """Fold one view into the KEEP best samples per texel, in place."""
    w = np.concatenate([best_w, weight[:, None]], axis=1)
    c = np.concatenate([best_c, rgb[:, None]], axis=1)
    top = np.argsort(-w, axis=1)[:, :KEEP]
    best_w[:] = np.take_along_axis(w, top, axis=1)
    best_c[:] = np.take_along_axis(c, top[..., None], axis=1)


def _blend(best_w: np.ndarray, best_c: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """(colour, whether the views agreed): the weighted mean of the samples near the texel's median
    colour; agreed when three or more samples were seen and three quarters of them are near it.
    With fewer than three there is no majority to judge by, so all are kept."""
    valid = best_w > 0
    median = np.nanmedian(np.where(valid[..., None], best_c, np.nan), axis=1, keepdims=True)
    far = np.abs(best_c - median).mean(axis=2) > AGREE
    count = valid.sum(axis=1)
    judged = (count >= 3)[:, None]
    w = np.where(valid & ~(far & judged), best_w, 0.0)
    w = np.where(w.sum(axis=1, keepdims=True) > 0, w, best_w)
    near = (valid & ~far).sum(axis=1)
    agreed = (count >= 3) & (near >= 0.75 * count)
    return (best_c * w[..., None]).sum(axis=1) / np.maximum(w.sum(axis=1, keepdims=True), 1e-12), agreed


def _rings(points: np.ndarray, colors: np.ndarray, trusted: np.ndarray, plate: np.ndarray) -> np.ndarray:
    """Plate texels that are not trusted take their 2 mm ring's median trusted colour (the nearest
    ring that has some, when theirs has none)."""
    out = colors.copy()
    ring = (np.hypot(points[:, 0], points[:, 2]) / 0.002).astype(int)
    good = plate & trusted
    if not good.any():
        return out
    known = np.unique(ring[good])
    medians = np.array([np.median(colors[good & (ring == k)], axis=0) for k in known])
    fix = plate & ~trusted
    nearest = np.abs(ring[fix][:, None] - known[None, :]).argmin(axis=1)
    out[fix] = medians[nearest]
    return out


def paint(positions: np.ndarray, normals: np.ndarray, faces: np.ndarray, uvs: np.ndarray, size: int,
          views: list[View], cloud: o3d.geometry.PointCloud,
          plate_faces: np.ndarray | None = None) -> tuple[np.ndarray, float, float]:
    """(RGB uint8 texture, share of the texture covered, share of covered texels a view painted).
    `plate_faces` marks the faces of a fitted plate (aligned frame, centred on the origin)."""
    pixels, points, tris, bary = texture.texels(positions, faces, uvs, size)
    tn = np.einsum("nk,nkj->nj", bary, normals[faces[tris]])
    tn /= np.maximum(np.linalg.norm(tn, axis=1, keepdims=True), 1e-9)
    points = points + 0.0005 * tn  # just off the surface, so the ray test does not hit the point itself

    scene = o3d.t.geometry.RaycastingScene()
    scene.add_triangles(o3d.core.Tensor(positions.astype(np.float32)), o3d.core.Tensor(faces.astype(np.uint32)))
    best_w, best_c = np.zeros((len(points), KEEP)), np.zeros((len(points), KEEP, 3))
    on_plate = None if plate_faces is None else plate_faces[tris]
    for view in views:
        weight, rgb = _sample(view, points, tn, _depths(scene, view), on_plate)
        _keep_best(best_w, best_c, weight, rgb)

    painted = best_w[:, 0] > 0
    colors, trusted = np.empty((len(points), 3)), np.zeros(len(points), bool)
    colors[painted], trusted[painted] = _blend(best_w[painted], best_c[painted])
    if (~painted).any():
        colors[~painted] = texture.from_points(points[~painted], np.asarray(cloud.points), np.asarray(cloud.colors))
    if on_plate is not None:
        colors = _rings(points, colors, trusted, on_plate)
    img = np.zeros((size, size, 3), np.float32)
    mask = np.zeros((size, size), bool)
    img[pixels[:, 1], pixels[:, 0]] = colors
    mask[pixels[:, 1], pixels[:, 0]] = True
    img = texture.pad(img, mask, iterations=8)
    return (np.clip(img, 0, 1) * 255).round().astype(np.uint8), float(mask.mean()), float(painted.mean())
