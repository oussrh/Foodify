"""Which pixels of each view are the plate: SAM 2 (Meta, Apache-2.0), prompted from what the
engine already knows in 3D.

The fitted plate (plate.py) says where the plate's rim is in every image: clicks on its near half
(the half facing the camera, never hidden by the food) say "this is the plate", the measured food's
points say "this is not", and the box is the plate's projected outline. SAM 2 then outlines the
plate round whatever stands on it, including what stereo never measured (the underside of food,
an overhang, a dim tray). Everything the dish's outline (masks.py) holds that is not plate is food:
paint.py paints each from its own pixels, hull.py carves the food from the food's.

`CAPTURE_SAM_MODEL` is the model's folder (the Docker image downloads it, pinned by revision).
About a second per view on the CPU.
"""

import os
from pathlib import Path
from typing import Callable

import numpy as np

from .plate import Plate
from .views import View

MODEL_ENV = "CAPTURE_SAM_MODEL"
Segment = Callable[[np.ndarray, np.ndarray, np.ndarray, list], np.ndarray]  # rgb, yes, no, box -> mask


def load() -> Segment | None:
    """SAM 2 as a function, or None where it is not installed (the dish is then painted without
    knowing plate from food, as before)."""
    folder = Path(os.environ.get(MODEL_ENV, "/models/sam2.1-hiera-tiny"))
    if not (folder / "config.json").exists():
        return None
    import torch
    from PIL import Image
    from transformers import Sam2Model, Sam2Processor

    torch.set_num_threads(os.cpu_count() or 4)
    processor, model = Sam2Processor.from_pretrained(folder), Sam2Model.from_pretrained(folder).eval()

    def segment(rgb: np.ndarray, yes: np.ndarray, no: np.ndarray, box: list) -> np.ndarray:
        points = np.concatenate([yes, no]).tolist()
        labels = [1] * len(yes) + [0] * len(no)
        inputs = processor(images=Image.fromarray(rgb), input_points=[[points]], input_labels=[[labels]],
                           input_boxes=[[box]], return_tensors="pt")
        with torch.no_grad():
            out = model(**inputs, multimask_output=False)
        return processor.post_process_masks(out.pred_masks.cpu(), inputs["original_sizes"])[0][0, 0].numpy() > 0

    return segment


def _project(view: View, points: np.ndarray) -> np.ndarray:
    fx, fy, cx, cy = view.k
    cam = points @ view.rotation.T + view.translation
    return np.column_stack([fx * cam[:, 0] / cam[:, 2] + cx, fy * cam[:, 1] / cam[:, 2] + cy])


def prompts(view: View, plate: Plate, food: np.ndarray, rng: np.random.Generator):
    """(plate clicks, not-plate clicks, box) for one view, in its pixels."""
    angle = np.linspace(0, 2 * np.pi, 48, endpoint=False)
    ring = lambda r: np.column_stack([r * np.cos(angle), plate.height(np.full(48, r)), r * np.sin(angle)])
    rim = ring(0.9 * plate.radius)
    dist = np.linalg.norm(rim - view.centre, axis=1)
    yes = _project(view, rim[dist < np.median(dist)][::3])
    no = _project(view, food[rng.choice(len(food), min(8, len(food)), replace=False)]) if len(food) else np.empty((0, 2))
    edge = _project(view, ring(plate.radius))
    h, w = view.image.shape[:2]
    box = [float(max(0, edge[:, 0].min())), float(max(0, edge[:, 1].min())),
           float(min(w, edge[:, 0].max())), float(min(h, edge[:, 1].max()))]
    return yes, no, box


def label(views: list[View], plate: Plate, food: np.ndarray, segment: Segment) -> None:
    """Set each view's `plate`: True where its pixels are the plate."""
    rng = np.random.default_rng(0)
    from .views import _small

    for view in views:
        yes, no, box = prompts(view, plate, food, rng)
        found = segment(view.image, yes, no, box)
        view.plate = _small(found, view.mask.shape) if view.mask is not None else _small(found)
