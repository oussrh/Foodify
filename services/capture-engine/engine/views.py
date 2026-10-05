"""The photos and frames the texture is painted from, as cameras in the dish's frame.

The same images dense stereo used (every photo, evenly spaced frames), undistorted again at full
size (COLMAP's undistorter, pinhole cameras), then moved by the alignment's transform
(mesh._transform: local = scale * (rotation @ x + offset)) so a point of the finished mesh projects
straight into each image.
"""

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from . import sfm


@dataclass
class View:
    name: str
    image: np.ndarray           # H x W x 3, RGB, uint8
    k: tuple                    # fx, fy, cx, cy (pinhole, undistorted)
    rotation: np.ndarray        # dish frame -> camera
    translation: np.ndarray     # metres
    still: bool                 # an HD photo, sharper than a video frame
    mask: np.ndarray | None = None   # True where the dish (plate and food) is
    plate: np.ndarray | None = None  # True where the plate is (labels.py)

    @property
    def centre(self) -> np.ndarray:
        return -self.rotation.T @ self.translation


def _cameras(txt: Path) -> dict[int, tuple]:
    cams = {}
    for line in (txt / "cameras.txt").read_text().splitlines():
        parts = line.split()
        if line.startswith("#") or len(parts) < 8 or parts[1] != "PINHOLE":
            continue
        cams[int(parts[0])] = tuple(map(float, parts[4:8]))
    return cams


def _poses(txt: Path):
    lines = [line for line in (txt / "images.txt").read_text().splitlines() if not line.startswith("#")]
    for line in lines[::2]:
        parts = line.split()
        if len(parts) >= 10:
            qw, qx, qy, qz, tx, ty, tz = map(float, parts[1:8])
            yield " ".join(parts[9:]), int(parts[8]), sfm._quat_to_rot(qw, qx, qy, qz), np.array([tx, ty, tz])


def _warped(bgr: np.ndarray) -> bool:
    """An image whose undistortion left a wide black border: its lens was estimated wrong (it
    happens to a handful of photos with a camera of their own), so it would paint the wrong place."""
    h, w = bgr.shape[:2]
    border = np.concatenate([bgr[: h // 20].reshape(-1, 3), bgr[-h // 20:].reshape(-1, 3),
                             bgr[:, : w // 20].reshape(-1, 3), bgr[:, -w // 20:].reshape(-1, 3)])
    return float((border.max(axis=1) < 8).mean()) > 0.3


def to_dish(rotation: np.ndarray, translation: np.ndarray, transform: dict) -> tuple[np.ndarray, np.ndarray]:
    """A COLMAP camera (x_cam = R x + t) in the dish's frame, in metres."""
    rot, offset, scale = np.array(transform["rotation"]), np.array(transform["offset"]), transform["scale"]
    r = rotation @ rot.T
    return r, scale * (translation - r @ offset)


def load(images_dir: Path, model: Path, names: list[str], workspace: Path, transform: dict,
         log: Path, max_size: int = 2400) -> list[View]:
    """Undistort `names` at full size and load them as views in the dish's frame."""
    out = workspace / "bake"
    listing = workspace / "bake_images.txt"
    listing.write_text("\n".join(names) + "\n")
    sfm._colmap(["image_undistorter", "--image_path", str(images_dir), "--input_path", str(model),
                 "--output_path", str(out), "--output_type", "COLMAP", "--max_image_size", str(max_size),
                 "--image_list_path", str(listing)], log)
    txt = out / "txt"
    txt.mkdir(exist_ok=True)
    sfm._colmap(["model_converter", "--input_path", str(out / "sparse"), "--output_path", str(txt),
                 "--output_type", "TXT"], log)
    cams, views = _cameras(txt), []
    for name, cam, rotation, translation in _poses(txt):
        bgr = cv2.imread(str(out / "images" / name), cv2.IMREAD_COLOR)
        if bgr is None or cam not in cams or _warped(bgr):
            continue
        r, t = to_dish(rotation, translation, transform)
        views.append(View(name, cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB), cams[cam], r, t, name.startswith("stills/")))
    return views


def add_masks(views: list[View], predict) -> None:
    """Where the dish is in each view, so the room never paints its edge."""
    from .masks import clean

    for view in views:
        view.mask = clean(predict(view.image), grow=0) > 0
