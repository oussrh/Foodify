"""Render a synthetic dish capture with known dimensions, as a phone video, to test the whole pipeline.

A 27 cm plate with a raised rim and 'food' (5.7 cm high in all) on a patterned placemat, a glass
beside it and a wall behind, filmed on three circles (15, 35 and 65 degrees). Ray-cast with
Open3D, procedural textures so feature matching has something to hold on to.

    python tests/render_capture.py out/synthetic        # writes frames/ and capture.mp4
    python run_local.py --source out/synthetic/capture.mp4 --plate-cm 27 --colmap <COLMAP.bat>
"""

import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
import open3d as o3d

W, H, FOV = 1280, 960, 55.0
LIGHT = np.array([0.3, 1.0, 0.2]) / np.linalg.norm([0.3, 1.0, 0.2])


def _hash(cells: np.ndarray, seed: int) -> np.ndarray:
    """Deterministic pseudo-random value in [0, 1) per integer cell."""
    x = cells.astype(np.int64) * np.array([73856093, 19349663, 83492791])[: cells.shape[1]]
    v = np.bitwise_xor.reduce(x, axis=1) ^ seed
    v = (v ^ (v >> 13)) * 1274126177
    return ((v ^ (v >> 16)) & 0xFFFF) / 65536.0


def _palette(values: np.ndarray, colors: list) -> np.ndarray:
    return np.array(colors)[(values * len(colors)).astype(int) % len(colors)]


def _shade_table(p):
    tile = _palette(_hash(np.floor(p[:, [0, 2]] / 0.012), 1), [[.75, .25, .2], [.9, .85, .7], [.2, .35, .55], [.3, .55, .3]])
    return tile * (0.8 + 0.2 * _hash(np.floor(p[:, [0, 2]] / 0.003), 2))[:, None]


def _shade_plate(p):
    return np.full((len(p), 3), 0.93) * (0.94 + 0.06 * _hash(np.floor(p / 0.003), 3))[:, None]


def _shade_food(p):
    base = _palette(_hash(np.floor(p / 0.006), 4), [[.8, .3, .1], [.35, .6, .2], [.55, .3, .15], [.9, .7, .2]])
    return base * (0.7 + 0.3 * _hash(np.floor(p / 0.0015), 5))[:, None]


def _shade_other(p):
    return np.full((len(p), 3), [.8, .82, .85]) * (0.85 + 0.15 * _hash(np.floor(p / 0.02), 6))[:, None]


def _upright(mesh):
    """Open3D builds cylinders and tori around Z; stand them on Y."""
    return mesh.rotate(mesh.get_rotation_matrix_from_xyz((-np.pi / 2, 0, 0)), center=(0, 0, 0))


def scene() -> tuple[o3d.t.geometry.RaycastingScene, list]:
    table = o3d.geometry.TriangleMesh.create_box(2, 0.01, 2).translate((-1, -0.01, -1))
    plate = _upright(o3d.geometry.TriangleMesh.create_cylinder(0.135, 0.012, resolution=120)).translate((0, 0.006, 0))
    rim = _upright(o3d.geometry.TriangleMesh.create_torus(0.123, 0.008, 120, 24)).translate((0, 0.012, 0))
    food = o3d.geometry.TriangleMesh.create_sphere(1.0, resolution=80)
    food.vertices = o3d.utility.Vector3dVector(np.asarray(food.vertices) * [0.08, 0.045, 0.07] + [0.01, 0.012, 0])
    glass = _upright(o3d.geometry.TriangleMesh.create_cylinder(0.035, 0.11, resolution=60)).translate((0.24, 0.055, 0.05))
    wall = o3d.geometry.TriangleMesh.create_box(2, 1.2, 0.02).translate((-1, 0, -0.7))
    objects = [(table, _shade_table), (plate, _shade_plate), (rim, _shade_plate), (food, _shade_food),
               (glass, _shade_other), (wall, _shade_other)]
    rs = o3d.t.geometry.RaycastingScene()
    for mesh, _ in objects:
        rs.add_triangles(o3d.t.geometry.TriangleMesh.from_legacy(mesh))
    return rs, [shade for _, shade in objects]


def render(rs, shaders, eye, target) -> np.ndarray:
    rays = o3d.t.geometry.RaycastingScene.create_rays_pinhole(
        fov_deg=FOV, center=target, eye=eye, up=[0, 1, 0], width_px=W, height_px=H)
    hit = rs.cast_rays(rays)
    rays = rays.numpy().reshape(-1, 6)
    t = hit["t_hit"].numpy().ravel()
    ids = hit["geometry_ids"].numpy().ravel()
    normals = hit["primitive_normals"].numpy().reshape(-1, 3)
    img = np.full((W * H, 3), 0.15)
    ok = np.isfinite(t)
    p = rays[ok, :3] + rays[ok, 3:] * t[ok, None]
    n = normals[ok]
    n[(n * rays[ok, 3:]).sum(1) > 0] *= -1
    color = np.zeros((ok.sum(), 3))
    for gid, shade in enumerate(shaders):
        sel = ids[ok] == gid
        if sel.any():
            color[sel] = shade(p[sel])
    img[ok] = color * (0.35 + 0.65 * np.clip(n @ LIGHT, 0, 1))[:, None]
    img = (np.clip(img, 0, 1) ** (1 / 2.2) * 255).astype(np.uint8).reshape(H, W, 3)
    img = np.ascontiguousarray(img[::-1, ::-1])  # Open3D's pinhole rays come out rotated 180 degrees
    return cv2.GaussianBlur(img, (3, 3), 0.6)


def main(out: Path, per_ring: int = 54) -> None:
    frames = out / "frames"
    frames.mkdir(parents=True, exist_ok=True)
    rs, shaders = scene()
    rng = np.random.default_rng(3)
    i = 0
    for elevation in (15, 35, 65):
        for k in range(per_ring):
            e, a = np.radians(elevation), 2 * np.pi * k / per_ring
            eye = 0.42 * np.array([np.cos(e) * np.cos(a), np.sin(e), np.cos(e) * np.sin(a)])
            target = np.array([0, 0.03, 0]) + rng.normal(0, 0.008, 3)
            img = render(rs, shaders, eye, target)
            cv2.imwrite(str(frames / f"f_{i:04d}.png"), cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
            i += 1
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "5", "-i", str(frames / "f_%04d.png"),
                    "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", str(out / "capture.mp4")], check=True)
    print(f"{i} frames, video at {out / 'capture.mp4'}")


if __name__ == "__main__":
    main(Path(sys.argv[1] if len(sys.argv) > 1 else "out/synthetic"))
