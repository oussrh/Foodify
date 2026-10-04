"""Turntable mode without a GPU or the model: the movement check, the turning axis, the turntable
alignment and the mask clean-up, on synthetic cameras, clouds and probability maps. From the
engine's folder, as a module:

    python -m tests.turntable_test
"""

import tempfile
from pathlib import Path

import cv2
import numpy as np
import open3d as o3d

from engine import masks, mesh, orbit


def check(label: str, ok: bool, detail="") -> None:
    print(f"{'ok  ' if ok else 'FAIL'} {label} {detail}")
    if not ok:
        raise SystemExit(1)


def _rotation(axis: np.ndarray, angle: float) -> np.ndarray:
    axis = axis / np.linalg.norm(axis)
    k = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + np.sin(angle) * k + (1 - np.cos(angle)) * k @ k


def _orbit(up: np.ndarray, turns=(0.35, 0.6, 0.9), per_turn=50, seed=1):
    """Cameras as a turntable capture places them: one circle per height round `up`, looking at
    the origin, a little hand shake, in filming order."""
    rng = np.random.default_rng(seed)
    side = np.cross(up, [0.0, 0.0, 1.0] if abs(up[2]) < 0.9 else [1.0, 0.0, 0.0])
    side /= np.linalg.norm(side)
    centres = []
    for elevation in turns:
        start = side * np.cos(elevation) + up * np.sin(elevation)
        for k in range(per_turn):
            centres.append(_rotation(up, 2 * np.pi * k / per_turn) @ start + rng.normal(0, 0.003, 3))
    centres = np.array(centres)
    dirs = -centres / np.linalg.norm(centres, axis=1, keepdims=True)
    names = [f"video/frame_{i:04d}.jpg" for i in range(len(centres))]
    return centres, dirs, names


def motion() -> None:
    up = np.array([0.2, 0.9, -0.3]) / np.linalg.norm([0.2, 0.9, -0.3])
    _, dirs, _ = _orbit(up)
    check("a capture that went round is accepted", orbit.check_motion(dirs, "turntable") > 120)
    still = np.tile([0.0, -0.6, 0.8], (40, 1)) + np.random.default_rng(2).normal(0, 0.02, (40, 3))
    for mode, words in [("walkaround", "The plate turns"), ("turntable", "I walk around the dish")]:
        try:
            orbit.check_motion(still, mode)
            check(f"a phone that did not go round fails in {mode} mode", False)
        except orbit.CaptureError as error:
            check(f"a phone that did not go round fails in {mode} mode, pointing to the other", words in str(error))


def axis() -> None:
    up = np.array([0.2, 0.9, -0.3]) / np.linalg.norm([0.2, 0.9, -0.3])
    centres, dirs, names = _orbit(up)
    found = orbit.turn_axis(centres, dirs, names)
    check("the turning axis is found, pointing up", float(found @ up) > 0.995, f"(cos {found @ up:.4f})")
    perm = np.random.default_rng(3).permutation(len(names))  # COLMAP lists images in its own order
    found = orbit.turn_axis(centres[perm], dirs[perm], [names[i] for i in perm])
    check("frames are read in filming order, whatever order they come in", float(found @ up) > 0.995)


def alignment() -> None:
    """A 0.4-unit plate with a box on it, tilted and moved: back to metres, upright, centred."""
    rng = np.random.default_rng(4)
    r, t = 0.2 * np.sqrt(rng.random(20000)), rng.random(20000) * 2 * np.pi
    plate = np.column_stack([r * np.cos(t), 0.01 * (r / 0.2) ** 2, r * np.sin(t)])
    box = rng.random((8000, 3)) * [0.16, 0.08, 0.1] - [0.08, 0.0, 0.05]
    pts = np.vstack([plate, box])
    up = np.array([0.2, 0.9, -0.3]) / np.linalg.norm([0.2, 0.9, -0.3])
    tilt = mesh._rotation_to_y(up).T
    world = pts @ tilt.T + [1.0, -2.0, 0.5]
    cloud = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(world))
    cloud.colors = o3d.utility.Vector3dVector(np.full((len(world), 3), 0.5))
    centres = (np.array([[0.0, 0.6, 0.6]]) @ tilt.T) + [1.0, -2.0, 0.5]
    out, info = mesh.align_turntable(cloud, centres, up, 0.24, 1.06)
    p = np.asarray(out.points)
    width = p[:, 0].max() - p[:, 0].min()
    check("the plate is the given width", abs(width - 0.24) < 0.01, f"({width:.3f} m)")
    check("the base is at y = 0", abs(np.percentile(p[:, 1], 0.5)) < 0.002)
    check("the box stands up", abs(p[:, 1].max() - 0.08 * 0.24 / 0.4) < 0.004, f"({p[:, 1].max():.3f} m)")
    check("the dish is centred", np.abs(np.median(p[:, [0, 2]], axis=0)).max() < 0.01)
    check("the camera is above the plate", info["camera_height_m"] > 0)


def cleaning() -> None:
    prob = np.zeros((200, 300), np.float32)
    cv2.circle(prob, (150, 110), 60, 1.0, -1)
    cv2.circle(prob, (150, 110), 15, 0.0, -1)   # a hole in the dish (a shiny spot)
    cv2.rectangle(prob, (10, 10), (40, 30), 1.0, -1)  # a glass behind it
    mask = masks.clean(prob)
    check("the dish is kept and its holes filled", mask[110, 150] == 255 and mask[110, 100] == 255)
    check("a smaller region elsewhere goes", mask[20, 25] == 0)
    check("the edge grows a little", mask[110, 211] == 255 and mask[110, 215] == 0)
    check("for fusion the edge stays where it is", masks.clean(prob, grow=0)[110, 211] == 0)
    check("nothing found is an empty mask", masks.clean(np.zeros((50, 50), np.float32)).max() == 0)
    with tempfile.TemporaryDirectory() as tmp:
        images = Path(tmp) / "images"
        (images / "video").mkdir(parents=True)
        cv2.imwrite(str(images / "video" / "frame_0000.jpg"), np.zeros((200, 300, 3), np.uint8))
        names = masks.image_names(images)
        share = masks.write_masks(images, names, Path(tmp) / "masks", lambda rgb: prob)
        written = Path(tmp) / "masks" / "video" / "frame_0000.jpg.png"
        check("masks are written where COLMAP looks for them", names == ["video/frame_0000.jpg"] and written.exists())
        check("the dish's share of the image is reported", 0.15 < share < 0.25, f"({share:.3f})")


def main() -> None:
    motion()
    axis()
    alignment()
    cleaning()
    print("turntable: all checks passed")


if __name__ == "__main__":
    main()
