"""The photos and frames the texture is painted from, as cameras in the dish's frame.

COLMAP places the cameras on 1920-pixel copies; the texture is painted from the same images at full
size (frames.prepare_images keeps them: a 4K frame, a photo at 16 MP), undistorted here with the
lens COLMAP estimated, scaled to the full size (a lens's distortion does not depend on the image's
size; its focal length and centre scale with it). Each view is then moved by the alignment's
transform (mesh._transform: local = scale * (rotation @ x + offset)) so a point of the finished
mesh projects straight into it.

The dish's outline and the plate's (masks.py, labels.py) are kept at LABEL_EDGE and read through
`at`, so 48 full-size views fit in a laptop's memory.
"""

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

from . import sfm

LABEL_EDGE = 1920
MAX_VIEWS = 48
MAX_BLANK = 0.15  # an undistorted view with more of its picture left blank had its lens estimated wrong


@dataclass
class View:
    name: str
    image: np.ndarray           # H x W x 3, RGB, uint8, undistorted
    k: tuple                    # fx, fy, cx, cy (pinhole, undistorted)
    rotation: np.ndarray        # dish frame -> camera
    translation: np.ndarray     # metres
    still: bool                 # an HD photo, sharper than a video frame
    mask: np.ndarray | None = None   # True where the dish (plate and food) is, at LABEL_EDGE or less
    plate: np.ndarray | None = None  # True where the plate is (labels.py), the same size as `mask`

    @property
    def centre(self) -> np.ndarray:
        return -self.rotation.T @ self.translation

    def at(self, layer: np.ndarray, u: np.ndarray, v: np.ndarray) -> np.ndarray:
        """`layer` (a mask or label, any size) at image pixels (u, v)."""
        h, w = self.image.shape[:2]
        lh, lw = layer.shape[:2]
        return layer[np.clip((v * lh / h).astype(int), 0, lh - 1), np.clip((u * lw / w).astype(int), 0, lw - 1)]


def _lens(model: str, params: list[float]) -> tuple[np.ndarray, np.ndarray] | None:
    """(K, distortion as OpenCV takes it) of a COLMAP camera, or None for a model not handled."""
    if model in ("PINHOLE", "OPENCV"):
        fx, fy, cx, cy = params[:4]
        dist = params[4:8] if model == "OPENCV" else [0.0] * 4
    elif model in ("SIMPLE_PINHOLE", "SIMPLE_RADIAL", "RADIAL"):
        fx = fy = params[0]
        cx, cy = params[1:3]
        dist = {"SIMPLE_PINHOLE": [0.0, 0.0], "SIMPLE_RADIAL": [params[3], 0.0], "RADIAL": params[3:5]}[model] + [0.0, 0.0]
    else:
        return None
    return np.array([[fx, 0, cx], [0, fy, cy], [0, 0, 1.0]]), np.array(dist, float)


def _cameras(txt: Path) -> dict[int, tuple]:
    """Camera id -> (width, height, K, distortion)."""
    cams = {}
    for line in (txt / "cameras.txt").read_text().splitlines():
        parts = line.split()
        if line.startswith("#") or len(parts) < 5:
            continue
        lens = _lens(parts[1], list(map(float, parts[4:])))
        if lens is not None:
            cams[int(parts[0])] = (int(parts[2]), int(parts[3]), *lens)
    return cams


def _poses(txt: Path):
    lines = [line for line in (txt / "images.txt").read_text().splitlines() if not line.startswith("#")]
    for line in lines[::2]:
        parts = line.split()
        if len(parts) >= 10:
            qw, qx, qy, qz, tx, ty, tz = map(float, parts[1:8])
            yield " ".join(parts[9:]), int(parts[8]), sfm._quat_to_rot(qw, qx, qy, qz), np.array([tx, ty, tz])


def to_dish(rotation: np.ndarray, translation: np.ndarray, transform: dict) -> tuple[np.ndarray, np.ndarray]:
    """A COLMAP camera (x_cam = R x + t) in the dish's frame, in metres."""
    rot, offset, scale = np.array(transform["rotation"]), np.array(transform["offset"]), transform["scale"]
    r = rotation @ rot.T
    return r, scale * (translation - r @ offset)


def _undistort(bgr: np.ndarray, camera: tuple) -> tuple[np.ndarray, tuple, np.ndarray] | None:
    """(RGB undistorted at its own size, its pinhole k, where it holds picture), or None when the
    lens leaves too much of it blank."""
    width, height, k, dist = camera
    h, w = bgr.shape[:2]
    s = w / width
    if abs(h / height - s) > 0.02 * s:
        return None  # not the image COLMAP placed
    k = k.copy()
    k[:2] *= s
    out = cv2.undistort(bgr, k, dist, None, k)
    valid = cv2.undistort(np.full((h, w), 255, np.uint8), k, dist, None, k) > 0
    if 1 - valid.mean() > MAX_BLANK:
        return None
    return cv2.cvtColor(out, cv2.COLOR_BGR2RGB), (k[0, 0], k[1, 1], k[0, 2], k[1, 2]), valid


def _pick(names: list[str]) -> list[str]:
    """Every photo, and frames evenly spaced, MAX_VIEWS in all."""
    stills = [n for n in names if n.startswith("stills/")]
    frames = [n for n in names if not n.startswith("stills/")]
    room = max(MAX_VIEWS - len(stills), 0)
    if len(frames) > room:
        frames = [frames[i] for i in np.linspace(0, len(frames) - 1, room).round().astype(int)]
    return stills + frames


def _small(layer: np.ndarray, shape: tuple | None = None) -> np.ndarray:
    """A mask at LABEL_EDGE on its long side, or at `shape` (nearest, so it stays a mask)."""
    h, w = layer.shape[:2]
    if shape is None:
        f = LABEL_EDGE / max(h, w)
        if f >= 1:
            return layer
        shape = (round(h * f), round(w * f))
    return cv2.resize(layer.astype(np.uint8), (shape[1], shape[0]), interpolation=cv2.INTER_NEAREST) > 0


def load(images_dir: Path, model: Path, names: list[str], workspace: Path, transform: dict,
         log: Path) -> list[View]:
    """`names` (or MAX_VIEWS of them) from `images_dir` at the size they are there, undistorted,
    as views in the dish's frame. Images too warped by their lens to trust are left out."""
    txt = workspace / "views_txt"
    txt.mkdir(parents=True, exist_ok=True)
    sfm._colmap(["model_converter", "--input_path", str(model), "--output_path", str(txt), "--output_type", "TXT"], log)
    cams, wanted, views = _cameras(txt), set(_pick(names)), []
    for name, cam, rotation, translation in sorted(_poses(txt), key=lambda pose: pose[0]):
        if name not in wanted or cam not in cams:
            continue
        bgr = cv2.imread(str(images_dir / name), cv2.IMREAD_COLOR)
        fixed = _undistort(bgr, cams[cam]) if bgr is not None else None
        if fixed is None:
            continue
        rgb, k, valid = fixed
        r, t = to_dish(rotation, translation, transform)
        views.append(View(name, rgb, k, r, t, name.startswith("stills/"), mask=_small(valid)))
    return views


def add_masks(views: list[View], predict) -> None:
    """Where the dish is in each view, within the picture the undistortion left, so the room never
    paints its edge."""
    from .masks import clean

    for view in views:
        dish = _small(clean(predict(view.image), grow=0) > 0)
        view.mask = dish if view.mask is None else dish & _small(view.mask, dish.shape)
