"""Runs everything after COLMAP on a synthetic dish, on any machine (no GPU, no COLMAP).

A table, a 27 cm plate with a raised rim and a dome of 'food', a glass beside the plate and a
wall behind, seen by cameras on three rings, then rotated, scaled and moved arbitrarily as COLMAP
would leave it. The pipeline must find up, the centre and the size again, leave out the glass,
the wall and the tablecloth, and write a valid GLB and USDZ.

    python tests/smoke_test.py
"""

import json
import sys
import tempfile
from pathlib import Path

import numpy as np
import open3d as o3d

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine import mesh  # noqa: E402
from engine.pipeline import Params, build_asset  # noqa: E402

rng = np.random.default_rng(7)


def disk(r0, r1, n):
    r = np.sqrt(rng.uniform(r0 ** 2, r1 ** 2, n))
    t = rng.uniform(0, 2 * np.pi, n)
    return r * np.cos(t), r * np.sin(t)


def scene():
    """Units: plate radius = 1 (so the plate is 2 units across)."""
    parts = []
    x, z = disk(1.0, 3.0, 120_000)                       # table
    parts.append((np.column_stack([x, np.zeros_like(x), z]), [0.55, 0.45, 0.35], None))
    x, z = disk(0.0, 0.85, 60_000)                        # plate well
    parts.append((np.column_stack([x, np.full_like(x, 0.02), z]), [0.95, 0.95, 0.93], None))
    x, z = disk(0.85, 1.0, 20_000)                        # rim rising to 0.06
    y = 0.02 + 0.04 * (np.hypot(x, z) - 0.85) / 0.15
    parts.append((np.column_stack([x, y, z]), [0.95, 0.95, 0.93], None))
    t = rng.uniform(0, 2 * np.pi, 15_000)                 # a glass beside the plate (clutter)
    y = rng.uniform(0, 1.0, 15_000)
    glass = np.column_stack([1.8 + 0.25 * np.cos(t), y, 0.25 * np.sin(t)])
    parts.append((glass, [0.7, 0.8, 0.9], np.column_stack([np.cos(t), np.zeros_like(t), np.sin(t)])))
    x, y = rng.uniform(-3, 3, 90_000), rng.uniform(0, 3, 90_000)  # a wall behind it
    parts.append((np.column_stack([x, y, np.full_like(x, -2.2)]), [0.9, 0.9, 0.85],
                  np.tile([0, 0, 1.0], (len(x), 1))))
    d = rng.normal(size=(80_000, 3))                      # dome of food
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    d = d[d[:, 1] > 0]
    food = d * [0.6, 0.4, 0.6] + [0, 0.02, 0]
    parts.append((food, [0.8, 0.3, 0.1], d))

    pts = np.concatenate([p for p, _, _ in parts])
    cols = np.concatenate([np.tile(c, (len(p), 1)) for p, c, _ in parts])
    cols = np.clip(cols + rng.normal(0, 0.02, cols.shape), 0, 1)
    nors = np.concatenate([n if n is not None else np.tile([0, 1.0, 0], (len(p), 1)) for p, _, n in parts])

    cams, dirs = [], []
    for elevation in (15, 35, 65):
        for azimuth in range(0, 360, 10):
            e, a = np.radians(elevation), np.radians(azimuth)
            c = 3.0 * np.array([np.cos(e) * np.cos(a), np.sin(e), np.cos(e) * np.sin(a)])
            cams.append(c)
            dirs.append(-c / np.linalg.norm(c) + rng.normal(0, 0.01, 3))
    return pts, cols, nors, np.array(cams), np.array(dirs)


def random_similarity(pts, nors, cams, dirs):
    q, _ = np.linalg.qr(rng.normal(size=(3, 3)))
    s, t = 4.2, np.array([10.0, -3.0, 7.0])
    return pts @ q.T * s + t, nors @ q.T, cams @ q.T * s + t, dirs @ q.T


def main():
    pts, cols, nors, cams, dirs = scene()
    pts, nors, cams, dirs = random_similarity(pts, nors, cams, dirs)
    pcd = o3d.geometry.PointCloud()
    pcd.points = o3d.utility.Vector3dVector(pts)
    pcd.colors = o3d.utility.Vector3dVector(cols)
    pcd.normals = o3d.utility.Vector3dVector(nors)

    params = Params(plate_cm=27.0, triangles=20_000, texture_size=1024, base_text="Chez Foodify")
    cloud, info = mesh.align_and_scale(pcd, cams, dirs / np.linalg.norm(dirs, axis=1, keepdims=True),
                                       params.plate_cm / 100, params.crop_margin)
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp)
        asset = build_asset(cloud, info, out, params)
        glb = (out / "dish.glb").read_bytes()
    print(json.dumps({"alignment": info, "asset": asset}, indent=2))

    width = asset["size_cm"]["width"]
    height = asset["size_cm"]["height"]
    assert glb[:4] == b"glTF", "not a GLB"
    assert 25 <= width <= 29, f"plate should be ~27 cm wide (no tablecloth, no glass), got {width}"
    true_scale = 0.27 / (2 * 4.2)  # plate radius 1 unit, then scaled by 4.2 in random_similarity
    assert abs(info["scale"] / true_scale - 1) < 0.05, f"scale off by {info['scale'] / true_scale - 1:.0%}"
    assert 5.0 <= height <= 6.2, f"dish should be ~5.7 cm tall (0.42 units x 13.5 cm), got {height}"
    assert asset["triangles"] <= 20_000
    assert not asset["usdz_issues"], asset["usdz_issues"]
    assert asset["base"] and asset["base"]["shows"] == "text", asset["base"]
    assert asset["base"]["faces"] > 100, "the underside should be its own branded part"
    print("\nsmoke test passed")


if __name__ == "__main__":
    main()
