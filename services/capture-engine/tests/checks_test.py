"""The upload check's judgement and the plate labels' prompts, on made-up measures and a made-up
camera, no video, no model. From the engine's folder, as a module:

    python -m tests.checks_test
"""

import numpy as np

from engine import labels, plate, preflight
from engine.views import View


def check(label: str, ok: bool, detail="") -> None:
    print(f"{'ok  ' if ok else 'FAIL'} {label} {detail}")
    if not ok:
        raise SystemExit(1)


def _measures(**over) -> dict:
    """24 frames of a good walk-around: sharp, light, the dish a fifth of the picture, the room
    sliding past more than the dish changes."""
    m = {"sharpness": [120.0] * 24, "brightness": [0.5] * 24, "burnt": [0.0] * 24,
         "dish_share": [0.2] * 24, "dish_cut": [False] * 24, "room_change": [0.11] * 23, "dish_change": [0.10] * 23}
    return {**m, **over}


def judging() -> None:
    problems, warnings = preflight._judge(_measures(), "walkaround")
    check("a good walk-around passes", problems == [] and warnings == [], f"({problems}, {warnings})")
    turning = _measures(room_change=[0.04] * 23, dish_change=[0.10] * 23)
    check("a good turntable video passes as one", preflight._judge(turning, "turntable")[0] == [])
    check("a turntable video sent as a walk-around is stopped, saying which to choose",
          "The plate turns" in " ".join(preflight._judge(turning, "walkaround")[0]))
    check("a walk-around sent as a turntable video is stopped, saying which to choose",
          "I walk around" in " ".join(preflight._judge(_measures(), "turntable")[0]))
    still = _measures(room_change=[0.005] * 23, dish_change=[0.005] * 23)
    check("a video where nothing moved is stopped", "nothing moved" in " ".join(preflight._judge(still, "walkaround")[0]))
    blurred = _measures(sharpness=[20.0] * 16 + [120.0] * 8)
    check("a mostly blurred video is stopped", "blurred" in " ".join(preflight._judge(blurred, "walkaround")[0]))
    some = _measures(sharpness=[20.0] * 6 + [120.0] * 18)
    p, w = preflight._judge(some, "walkaround")
    check("a little blur is a warning, not a stop", p == [] and "blurred" in " ".join(w))
    check("a dark video is stopped", "too dark" in " ".join(preflight._judge(_measures(brightness=[0.1] * 24), "walkaround")[0]))
    check("a dish cut off by the edge is stopped",
          "cut off" in " ".join(preflight._judge(_measures(dish_cut=[True] * 20 + [False] * 4), "walkaround")[0]))
    check("a dish not found is stopped",
          "not found" in " ".join(preflight._judge(_measures(dish_share=[0.0] * 24), "walkaround")[0]))
    sharp_only = {k: v for k, v in _measures().items() if k in ("sharpness", "brightness", "burnt")}
    check("without the segmentation model, only sharpness and light are judged", preflight._judge(sharp_only, "walkaround") == ([], []))


def prompting() -> None:
    """A camera 40 cm out and 30 cm up, looking at a 12 cm-radius plate with food in the middle."""
    eye = np.array([0.0, 0.3, 0.4])
    forward = -eye / np.linalg.norm(eye)
    right = np.cross(forward, [0.0, 1.0, 0.0])
    right /= np.linalg.norm(right)
    rotation = np.stack([right, np.cross(forward, right), forward])
    view = View("v", np.zeros((600, 800, 3), np.uint8), (700.0, 700.0, 400.0, 300.0), rotation, -rotation @ eye, False)
    flat = plate.Plate(0.12, np.array([0.0, 0.12]), np.array([0.004, 0.004]), 0.003)
    food = np.random.default_rng(1).normal([0, 0.03, 0], 0.01, (200, 3))
    yes, no, box = labels.prompts(view, flat, food, np.random.default_rng(0))
    near_half = (yes[:, 1] > 300).all()
    check("the plate clicks are on the rim's near half, in the picture", len(yes) >= 6 and near_half and
          ((yes[:, 0] > 0) & (yes[:, 0] < 800)).all(), f"({len(yes)} clicks)")
    check("the food clicks say not-plate", len(no) == 8)
    x0, y0, x1, y1 = box
    check("the box holds every click", (yes[:, 0] >= x0).all() and (yes[:, 0] <= x1).all() and (yes[:, 1] >= y0).all()
          and (yes[:, 1] <= y1).all() and x0 < 400 < x1)
    seen = []
    labels.label([view], flat, food, lambda rgb, y, n, b: seen.append((len(y), len(n))) or np.ones(rgb.shape[:2], bool))
    check("each view gets its plate label from the segmenter", view.plate is not None and view.plate.all() and seen == [(len(yes), 8)])


def main() -> None:
    judging()
    prompting()
    print("checks: all passed")


if __name__ == "__main__":
    main()
