"""Cut the dish out of every image, for a capture where the plate turned and the phone stood still.

COLMAP finds the cameras from what stays put between images. On a turntable the room stays put
and the dish turns, so without masks the room wins: the cameras come out not moving and the dish
is a smear. With the room masked out only the dish is matched, and it looks to COLMAP exactly
like a phone that walked round a still plate.

The model is IS-Net (DIS, "isnet-general-use", Apache-2.0), run with onnxruntime on the GPU when
the CUDA build is installed (about 70 ms an image on a laptop RTX 4070, against 0.75 s on its CPU,
the masks the same), on the CPU otherwise. `CAPTURE_SEGMENT_MODEL` is its path (the Docker image downloads it).
"""

import os
from pathlib import Path
from typing import Callable

import cv2
import numpy as np

MODEL_ENV = "CAPTURE_SEGMENT_MODEL"
SIZE = 1024  # the model's input square

Predict = Callable[[np.ndarray], np.ndarray]  # RGB uint8 image -> foreground probability, same size


def _onnx(model: Path) -> Predict:
    import onnxruntime as ort

    providers = ["CPUExecutionProvider"]
    if "CUDAExecutionProvider" in ort.get_available_providers():
        if hasattr(ort, "preload_dlls"):
            ort.preload_dlls()  # the CUDA libraries the pip packages bring
        # Capped, and freed as it goes: COLMAP's depth step needs the GPU's memory after it.
        cuda = {"gpu_mem_limit": 1536 * 1024 ** 2, "arena_extend_strategy": "kSameAsRequested"}
        providers = [("CUDAExecutionProvider", cuda), "CPUExecutionProvider"]
    session = ort.InferenceSession(str(model), providers=providers)
    name = session.get_inputs()[0].name

    def predict(rgb: np.ndarray) -> np.ndarray:
        x = cv2.resize(rgb, (SIZE, SIZE), interpolation=cv2.INTER_AREA).astype(np.float32)
        x = x / max(float(x.max()), 1e-6) - 0.5  # the training normalisation: mean 0.5, std 1
        pred = session.run(None, {name: x.transpose(2, 0, 1)[None]})[0][0, 0]
        pred = (pred - pred.min()) / max(float(pred.max() - pred.min()), 1e-6)
        return cv2.resize(pred, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_LINEAR)

    return predict


def load() -> Predict:
    """The segmentation model; a clear error when it is not installed."""
    model = Path(os.environ.get(MODEL_ENV, "/models/isnet-general-use.onnx"))
    if not model.exists():
        raise RuntimeError(f"the segmentation model is missing ({model}); set {MODEL_ENV}")
    return _onnx(model)


def clean(prob: np.ndarray, grow: float = 0.01) -> np.ndarray:
    """Probability -> mask: the largest region only (a chair or a glass behind the dish goes),
    its holes filled, grown by `grow` of the image (1% by default, so the plate's rim keeps its
    features; 0 for fusion, where the grown edge is turntable baked onto the rim).
    255 is dish, 0 is ignored: COLMAP's convention."""
    fg = (prob > 0.5).astype(np.uint8)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if count < 2:
        return np.zeros_like(fg)
    largest = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask = np.where(labels == largest, 255, 0).astype(np.uint8)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cv2.drawContours(mask, contours, -1, 255, thickness=cv2.FILLED)
    if grow <= 0:
        return mask
    size = max(3, round(grow * max(mask.shape)))
    return cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size)))


def write_masks(images_dir: Path, names: list[str], masks_dir: Path, predict: Predict,
                grow: float = 0.01) -> float:
    """One mask per image, at `<masks_dir>/<name>.png` (subfolders mirrored), as COLMAP reads them,
    grown by `grow` (see clean). Returns the median share of the image the dish fills."""
    shares = []
    for name in names:
        bgr = cv2.imread(str(images_dir / name), cv2.IMREAD_COLOR)
        if bgr is None:
            raise RuntimeError(f"{name} could not be read for masking")
        mask = clean(predict(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)), grow)
        target = masks_dir / f"{name}.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(target), mask)
        shares.append(float((mask > 0).mean()))
    return float(np.median(shares)) if shares else 0.0


def image_names(images_dir: Path) -> list[str]:
    """Every image under `images_dir`, as COLMAP names them (`video/frame_0001.jpg`)."""
    return sorted(p.relative_to(images_dir).as_posix() for p in images_dir.rglob("*.jpg"))
