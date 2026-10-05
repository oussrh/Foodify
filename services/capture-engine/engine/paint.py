"""The texture painted from the photos and frames, not from the dense points.

Every view samples every texel it sees (a ray test against the whole model decides what is seen),
weighted by how square on, how close and how sharp it sees it there. Then each face of the mesh
takes ONE view, the best for it, and a face switches to its neighbours' view when that is nearly
as good, so the texture is a few large pieces, each from a single image, rather than an average of
several that are a pixel or two apart (which blurred printed text into a smear). The pieces meet
on faces that take the blend of the best views that agree instead. A face's view whose colour
disagrees with the others there (something in front of it, a highlight) gives way to that blend.

With a fitted plate and the views labelled (labels.py), the plate is painted only from plate pixels
and the food only from the rest. Plate texels left without a trusted colour (under the food) take
their ring's: the median of the trusted texels at the same distance from the centre.
"""

import cv2
import numpy as np
import open3d as o3d

from . import texture
from .views import View

STEP = 4       # depth is tested on every 4th pixel's ray, then compared with a margin
KEEP = 5       # best views blended where a single one will not do
AGREE = 0.12   # a sample further than this from the median colour (mean of |RGB|, 0-1) disagrees
STAY = 0.8     # a face takes its neighbours' view when that scores at least this share of its best
CHUNK = 200_000  # texels blended at a time: the best views of all of them at once would not fit


def _depths(scene: o3d.t.geometry.RaycastingScene, view: View) -> np.ndarray:
    """Distance to the mesh along every STEP-th pixel's ray, eroded so edges count as hidden."""
    h, w = view.image.shape[:2]
    fx, fy, cx, cy = view.k
    us, vs = np.meshgrid(np.arange(0, w, STEP) + 0.5, np.arange(0, h, STEP) + 0.5)
    d = np.stack([(us - cx) / fx, (vs - cy) / fy, np.ones_like(us)], axis=-1) @ view.rotation
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    rays = np.concatenate([np.broadcast_to(view.centre, d.shape), d], axis=-1).astype(np.float32)
    hit = scene.cast_rays(o3d.core.Tensor(rays))["t_hit"].numpy()
    return cv2.erode(np.where(np.isfinite(hit), hit, 1e3).astype(np.float32), np.ones((3, 3), np.uint8))


def _sharpness(view: View) -> np.ndarray:
    """Local detail of the view (Laplacian, smoothed), on a 1024-pixel copy, so views of different
    sizes compare."""
    gray = cv2.cvtColor(view.image, cv2.COLOR_RGB2GRAY)
    f = 1024 / max(gray.shape)
    small = cv2.resize(gray, None, fx=f, fy=f, interpolation=cv2.INTER_AREA).astype(np.float32)
    return cv2.GaussianBlur(np.abs(cv2.Laplacian(small, cv2.CV_32F)), (0, 0), 3) + 1.0


def _sample(view: View, points: np.ndarray, normals: np.ndarray, depth: np.ndarray,
            on_plate: np.ndarray | None = None):
    """(weight, RGB 0-255) of every point in this view; weight 0 where it is not seen, or where the
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
    if view.mask is not None:
        ok &= view.at(view.mask, u, v)
    if view.plate is not None and on_plate is not None:
        ok &= view.at(view.plate, u, v) == on_plate
    sharp = view.at(_sharpness(view), u, v)
    weight = np.where(ok, facing ** 2 / np.maximum(dist, 1e-3) ** 2 * sharp * (2.0 if view.still else 1.0), 0.0)
    rgb = np.zeros((len(points), 3), np.uint8)
    rgb[ok] = np.clip(_bilinear(view.image, u[ok], v[ok]), 0, 255).astype(np.uint8)
    return weight.astype(np.float32), rgb


def _bilinear(image: np.ndarray, u: np.ndarray, v: np.ndarray) -> np.ndarray:
    x0, y0 = np.floor(u - 0.5).astype(int), np.floor(v - 0.5).astype(int)
    fx, fy = (u - 0.5 - x0)[:, None], (v - 0.5 - y0)[:, None]
    px = lambda y, x: image[y, x].astype(np.float32)
    top = px(y0, x0) * (1 - fx) + px(y0, x0 + 1) * fx
    bottom = px(y0 + 1, x0) * (1 - fx) + px(y0 + 1, x0 + 1) * fx
    return top * (1 - fy) + bottom * fy


def _neighbours(faces: np.ndarray) -> np.ndarray:
    """(F, 3): the face across each edge, -1 where there is none."""
    edges = np.sort(np.stack([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]], axis=1), axis=2).reshape(-1, 2)
    owner = np.repeat(np.arange(len(faces)), 3)
    key = edges[:, 0].astype(np.int64) * (int(faces.max()) + 1) + edges[:, 1]
    order = np.argsort(key, kind="stable")
    same = key[order][1:] == key[order][:-1]
    out = np.full(len(edges), -1)
    a, b = order[:-1][same], order[1:][same]
    out[a], out[b] = owner[b], owner[a]
    return out.reshape(-1, 3)


def _choose(score: np.ndarray, near: np.ndarray, rounds: int = 3) -> np.ndarray:
    """One view per face (-1 for none): the best, then switched to the view two of its neighbours
    agree on whenever that view scores at least STAY of the best."""
    choice = np.where(score.max(axis=0) > 0, score.argmax(axis=0), -1)
    faces = np.arange(score.shape[1])
    for _ in range(rounds):
        n = np.where(near >= 0, choice[np.maximum(near, 0)], -1)
        pair = np.where((n[:, 0] == n[:, 1]) | (n[:, 0] == n[:, 2]), n[:, 0], np.where(n[:, 1] == n[:, 2], n[:, 1], -1))
        good = (pair >= 0) & (choice >= 0)
        good[good] &= score[pair[good], faces[good]] >= STAY * score[choice[good], faces[good]]
        choice = np.where(good, pair, choice)
    return choice


def _blend(w: np.ndarray, rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """For each texel, over its KEEP best samples: (the weighted mean of those near their median,
    the median, whether three or more were seen and three quarters of them agree)."""
    keep = min(KEEP, len(w))
    top = np.argpartition(-w, keep - 1, axis=0)[:keep] if keep < len(w) else np.broadcast_to(np.arange(len(w))[:, None], w.shape)
    bw = np.take_along_axis(w, top, axis=0)
    bc = np.take_along_axis(rgb, top[..., None], axis=0).astype(np.float32) / 255
    valid = bw > 0
    median = np.nanmedian(np.where(valid[..., None], bc, np.nan), axis=0)
    far = np.abs(bc - median).mean(axis=2) > AGREE
    count = valid.sum(axis=0)
    use = np.where(valid & ~(far & (count >= 3)), bw, 0.0)
    use = np.where(use.sum(axis=0) > 0, use, bw)
    mean = (bc * use[..., None]).sum(axis=0) / np.maximum(use.sum(axis=0), 1e-12)[:, None]
    return mean, median, (count >= 3) & ((valid & ~far).sum(axis=0) >= 0.75 * count)


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


def _colours(w: np.ndarray, rgb: np.ndarray, tris: np.ndarray, faces: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """(colour, trusted) of each texel seen by some view: its face's one view where that view saw it,
    agrees with the others and the face is not on a seam; the agreeing blend elsewhere."""
    near = _neighbours(faces)
    score = np.stack([np.bincount(tris, weights=wv, minlength=len(faces)) for wv in w])
    choice = _choose(score, near)
    seam = ((near >= 0) & (choice[np.maximum(near, 0)] != choice[:, None])).any(axis=1)
    chunks = [_blend(w[:, s:s + CHUNK], rgb[:, s:s + CHUNK]) for s in range(0, w.shape[1], CHUNK)]
    mean, median, agreed = (np.concatenate(part) for part in zip(*chunks))
    own = choice[tris]
    texel = np.arange(len(tris))
    single = rgb[np.maximum(own, 0), texel].astype(np.float32) / 255
    usable = (own >= 0) & (w[np.maximum(own, 0), texel] > 0) & ~seam[tris]
    usable &= np.abs(single - median).mean(axis=1) <= AGREE
    return np.where(usable[:, None], single, mean), agreed | usable


def paint(positions: np.ndarray, normals: np.ndarray, faces: np.ndarray, uvs: np.ndarray, size: int,
          views: list[View], cloud: o3d.geometry.PointCloud, plate_faces: np.ndarray | None = None,
          occluder: tuple[np.ndarray, np.ndarray] | None = None) -> tuple[np.ndarray, float, float]:
    """(RGB uint8 texture, share of the texture covered, share of covered texels a view painted).
    `plate_faces` marks the faces of a fitted plate (aligned frame, centred on the origin);
    `occluder` is the whole model (positions, faces) when this mesh is only a part of it."""
    pixels, points, tris, bary = texture.texels(positions, faces, uvs, size)
    tn = np.einsum("nk,nkj->nj", bary, normals[faces[tris]])
    tn /= np.maximum(np.linalg.norm(tn, axis=1, keepdims=True), 1e-9)
    points = points + 0.0005 * tn  # just off the surface, so the ray test does not hit the point itself

    scene_v, scene_f = occluder if occluder is not None else (positions, faces)
    scene = o3d.t.geometry.RaycastingScene()
    scene.add_triangles(o3d.core.Tensor(scene_v.astype(np.float32)), o3d.core.Tensor(scene_f.astype(np.uint32)))
    on_plate = None if plate_faces is None else plate_faces[tris]
    w = np.zeros((len(views), len(points)), np.float32)
    rgb = np.zeros((len(views), len(points), 3), np.uint8)
    for i, view in enumerate(views):
        w[i], rgb[i] = _sample(view, points, tn, _depths(scene, view), on_plate)

    painted = w.max(axis=0) > 0 if len(views) else np.zeros(len(points), bool)
    colors, trusted = np.empty((len(points), 3)), np.zeros(len(points), bool)
    if painted.any():
        colors[painted], trusted[painted] = _colours(w[:, painted], rgb[:, painted], tris[painted], faces)
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
