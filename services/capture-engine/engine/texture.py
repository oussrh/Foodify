"""UV unwrap (xatlas) and a colour bake from the dense points.

`bake` colours each texel from the nearest dense points: the fallback, and what a dish gets with
no views (the smoke test). paint.py colours it from the photos and frames themselves.

UV convention here is OpenGL/USD: (0, 0) is the bottom-left of the image. The GLB writer flips v.
"""

import cv2
import numpy as np
import xatlas
from scipy.spatial import cKDTree


def unwrap(vertices: np.ndarray, faces: np.ndarray, size: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Returns (vmapping, faces, uvs): new vertex i is old vertex vmapping[i].

    Packed for a `size` texture, 2 texels between charts and packed by brute force: a food mesh is
    some 1,800 small charts, and 4 texels between them left four fifths of the texture empty (2 and
    brute force fill 39% of it, against 22%). `pad` grows each chart's colour outward, so the
    narrower gap does not mix neighbours in the mipmaps.
    """
    atlas = xatlas.Atlas()
    atlas.add_mesh(vertices.astype(np.float32), faces.astype(np.uint32))
    pack = xatlas.PackOptions()
    pack.resolution = size
    pack.padding = 2
    pack.bruteForce = True
    pack.bilinear = True
    atlas.generate(pack_options=pack)
    if atlas.atlas_count != 1:
        raise RuntimeError(f"UV layout needed {atlas.atlas_count} textures; expected one")
    vmapping, indices, uvs = atlas.get_mesh(0)
    return vmapping, indices.astype(np.int64), uvs


def _barycentric(p: np.ndarray, a: np.ndarray, b: np.ndarray, c: np.ndarray) -> np.ndarray | None:
    v0, v1 = b - a, c - a
    den = v0[0] * v1[1] - v1[0] * v0[1]
    if abs(den) < 1e-12:
        return None
    v2 = p - a
    w1 = (v2[:, 0] * v1[1] - v1[0] * v2[:, 1]) / den
    w2 = (v0[0] * v2[:, 1] - v2[:, 0] * v0[1]) / den
    return np.column_stack([1 - w1 - w2, w1, w2])


def texels(vertices: np.ndarray, faces: np.ndarray, uvs: np.ndarray, size: int):
    """Every texel covered by a triangle: (pixel x/y, the 3D point it maps to, its triangle, the
    point's barycentric weights in it)."""
    uv_px = np.column_stack([uvs[:, 0] * size, (1 - uvs[:, 1]) * size])
    pixels, points, tris, weights = [], [], [], []
    for index, tri in enumerate(faces):
        a, b, c = uv_px[tri]
        lo = np.clip(np.floor(np.minimum(np.minimum(a, b), c)).astype(int), 0, size - 1)
        hi = np.clip(np.ceil(np.maximum(np.maximum(a, b), c)).astype(int), 0, size - 1)
        xs, ys = np.meshgrid(np.arange(lo[0], hi[0] + 1), np.arange(lo[1], hi[1] + 1))
        xs, ys = xs.ravel(), ys.ravel()
        w = _barycentric(np.column_stack([xs + 0.5, ys + 0.5]), a, b, c)
        if w is None:
            continue
        inside = (w >= -0.02).all(axis=1)  # a little past the edge, so seams have no gaps
        if inside.any():
            pixels.append(np.column_stack([xs[inside], ys[inside]]))
            points.append(w[inside] @ vertices[tri])
            tris.append(np.full(inside.sum(), index))
            weights.append(w[inside])
    return np.concatenate(pixels), np.concatenate(points), np.concatenate(tris), np.concatenate(weights)


def pad(img: np.ndarray, mask: np.ndarray, iterations: int) -> np.ndarray:
    """Grow colour outward from covered texels so mipmaps do not bleed black into the seams."""
    img = img.astype(np.float32)
    m = mask.astype(np.float32)
    for _ in range(iterations):
        total = cv2.blur(img * m[..., None], (3, 3))
        weight = cv2.blur(m, (3, 3))
        grow = (m == 0) & (weight > 0)
        img[grow] = total[grow] / weight[grow][:, None]
        m[grow] = 1
    return img


def from_points(points: np.ndarray, src_points: np.ndarray, src_colors: np.ndarray, k: int = 8) -> np.ndarray:
    """Each point's colour from the nearest dense points, inverse-distance weighted."""
    dist, idx = cKDTree(src_points).query(points, k=k, workers=-1)
    weight = 1.0 / np.maximum(dist, 1e-6)
    weight /= weight.sum(axis=1, keepdims=True)
    return (src_colors[idx] * weight[..., None]).sum(axis=1)


def bake(vertices: np.ndarray, faces: np.ndarray, uvs: np.ndarray, src_points: np.ndarray,
         src_colors: np.ndarray, size: int, k: int = 8) -> tuple[np.ndarray, float]:
    """Returns (RGB uint8 image, fraction of the texture covered by triangles)."""
    pixels, points, _, _ = texels(vertices, faces, uvs, size)
    colors = from_points(points, src_points, src_colors, k)

    img = np.zeros((size, size, 3), np.float32)
    mask = np.zeros((size, size), bool)
    img[pixels[:, 1], pixels[:, 0]] = colors
    mask[pixels[:, 1], pixels[:, 0]] = True
    img = pad(img, mask, iterations=8)
    return (np.clip(img, 0, 1) * 255).round().astype(np.uint8), float(mask.mean())
