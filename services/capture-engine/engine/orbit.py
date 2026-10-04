"""How the cameras moved round the dish: the check that a capture went round it at all, and the
turning axis of a turntable capture.

Both read only the camera poses, so they run straight after the sparse step and a capture that
cannot work fails in minutes rather than after the dense step.
"""

import numpy as np

MIN_SPREAD_DEG = 45.0  # one slow circle is 180; a phone held still and turned slightly, under 20


class CaptureError(RuntimeError):
    """The capture itself cannot make a model; the message says what to film differently."""


def view_spread(dirs: np.ndarray) -> float:
    """The widest angle between two cameras' viewing directions, in degrees."""
    unit = dirs / np.linalg.norm(dirs, axis=1, keepdims=True)
    return float(np.degrees(np.arccos(np.clip((unit @ unit.T).min(), -1.0, 1.0))))


def check_motion(dirs: np.ndarray, mode: str) -> float:
    """Fail when the cameras did not go round the dish; returns the spread in degrees."""
    spread = view_spread(dirs) if len(dirs) > 1 else 0.0
    if spread >= MIN_SPREAD_DEG:
        return spread
    if mode == "turntable":
        raise CaptureError(
            f"The dish hardly turned ({spread:.0f}° in all): turn the plate a full circle at each height. "
            "If you walked round the plate instead, choose \"I walk around the dish\".")
    raise CaptureError(
        f"The phone hardly moved round the dish ({spread:.0f}° in all). If the plate turned on a turntable, "
        "choose \"The plate turns\" and send the video again; otherwise walk all the way round the plate.")


def turn_axis(centres: np.ndarray, dirs: np.ndarray, names: list[str]) -> np.ndarray:
    """The turntable's axis, pointing up, from the video frames in filming order.

    Seen from the dish, a phone standing still while the plate turns moves on a circle round the
    axis: every step between two frames is at right angles to it. The axis is the direction the
    steps avoid (the smallest singular vector of the steps); the jumps where the phone was raised
    to the next height are left out.
    """
    order = [i for i, _ in sorted(enumerate(names), key=lambda pair: pair[1]) if not names[i].startswith("stills/")]
    steps = np.diff(centres[order], axis=0)
    length = np.linalg.norm(steps, axis=1)
    usable = (length > 1e-9) & (length < 3 * np.median(length))
    if usable.sum() < 10:
        raise CaptureError("Too few frames were placed to find how the plate turned; film more slowly")
    unit = steps[usable] / length[usable, None]
    axis = np.linalg.svd(unit, full_matrices=False)[2][-1]
    # The phone films the plate from above: up is against the way the cameras look.
    return axis if np.median(dirs @ axis) < 0 else -axis
