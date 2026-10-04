"""The upload check: a minute's look at the video before the long work, so a capture that cannot
make a good model is sent back with what to film differently, not after half an hour.

Twenty-four frames, spread over the video, at 640 pixels: sharp or not, light or not, the dish
found in each (masks.py) and whole in the picture, and what moved between them. Walking round a
still plate moves the room in the picture; turning the plate in front of a still phone moves only
the dish. A video filmed one way and sent as the other is caught here.
"""

import subprocess
from pathlib import Path

import cv2
import numpy as np

from . import frames
from .orbit import CaptureError

SAMPLES = 24
WIDTH = 640


def _frame(video: Path, at: float, hdr: bool) -> np.ndarray | None:
    chain = f"{frames.TONEMAP + ',' if hdr else ''}scale={WIDTH}:-2"
    done = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{at:.2f}", "-i", str(video), "-frames:v", "1",
                           "-vf", chain, "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True, timeout=120)
    if done.returncode != 0 or not done.stdout:
        return None
    return cv2.imdecode(np.frombuffer(done.stdout, np.uint8), cv2.IMREAD_COLOR)


def _measures(images: list[np.ndarray], predict) -> dict:
    """Per frame: sharpness, brightness, burnt share, the dish's share and whether it touches an
    edge; between frames: how much the room and the dish changed."""
    gray = [cv2.cvtColor(i, cv2.COLOR_BGR2GRAY) for i in images]
    out = {"sharpness": [float(cv2.Laplacian(g, cv2.CV_64F).var()) for g in gray],
           "brightness": [float(g.mean() / 255) for g in gray],
           "burnt": [float((g > 250).mean()) for g in gray]}
    if predict is None:
        return out
    from .masks import clean

    dish = [clean(predict(cv2.cvtColor(i, cv2.COLOR_BGR2RGB)), grow=0) > 0 for i in images]
    out["dish_share"] = [float(m.mean()) for m in dish]
    out["dish_cut"] = [bool(sum([m[0].any(), m[-1].any(), m[:, 0].any(), m[:, -1].any()]) >= 2) for m in dish]
    room, food = [], []
    for a, b, ma, mb in zip(gray, gray[1:], dish, dish[1:]):
        diff = np.abs(a.astype(np.float32) - b.astype(np.float32)) / 255
        background, both = ~(ma | mb), ma & mb
        room.append(float(diff[background].mean()) if background.any() else 0.0)
        food.append(float(diff[both].mean()) if both.any() else 0.0)
    out["room_change"], out["dish_change"] = room, food
    return out


def _judge(m: dict, mode: str) -> tuple[list[str], list[str]]:
    """(problems that stop the job, warnings for the review), in the manager's words."""
    problems, warnings = [], []
    blurry = float(np.mean(np.array(m["sharpness"]) < 40))
    if blurry > 0.5:
        problems.append(f"{blurry:.0%} of the video is blurred: move more slowly and lock the focus on the dish")
    elif blurry > 0.2:
        warnings.append(f"{blurry:.0%} of the video is blurred; slower circles give a sharper model")
    if np.median(m["brightness"]) < 0.2:
        problems.append("the video is too dark: film near a window or under the ceiling light")
    if np.median(m["burnt"]) > 0.08:
        warnings.append("bright parts of the picture are burnt white: avoid direct sun and lock the exposure")
    if "dish_share" not in m:
        return problems, warnings
    found = float(np.mean(np.array(m["dish_share"]) > 0.02))
    if found < 0.7:
        problems.append("the dish is not found in much of the video: keep the plate in the middle of the picture")
    share = float(np.median(m["dish_share"]))
    if share < 0.05:
        warnings.append("the dish is small in the picture: film from 30-50 cm, not further")
    cut = float(np.mean(m["dish_cut"]))
    if cut > 0.5:
        problems.append("the plate is cut off by the edge of the picture in much of the video: step back so it is whole")
    elif cut > 0.2:
        warnings.append("the plate is cut off by the edge of the picture at times: keep it whole in view")
    problems += _movement(m, mode)
    return problems, warnings


def _movement(m: dict, mode: str) -> list[str]:
    room, dish = float(np.median(m["room_change"])), float(np.median(m["dish_change"]))
    if room < 0.02 and dish < 0.02:
        return ["nothing moved between the frames: walk round the plate, or turn it, while filming"]
    # Walking round, the whole room slides past and changes at least as much as the dish; on a
    # turntable the dish changes several times more than the room (the first real turntable
    # video: 2.7 times, the room still changing a little as the phone was raised between turns).
    if mode == "walkaround" and dish > 2.2 * room and room < 0.06:
        return ["the room stays still while the dish changes, so the plate turned: choose \"The plate turns\""]
    if mode == "turntable" and room > 0.06 and room > 0.7 * dish:
        return ["the room moves in the picture, so the phone moved: hold it still while the plate turns, "
                "or choose \"I walk around the dish\""]
    return []


def check(source: Path, mode: str, predict) -> dict:
    """Look at the capture's video; raises CaptureError with every problem found, or returns the
    measures and the warnings."""
    videos, _ = frames._sources(source)
    if not videos:
        return {"checked": False, "warnings": []}
    video = videos[0]
    stream, duration = frames._probe(video)
    hdr = stream.get("color_transfer") in frames.HDR_TRANSFERS
    times = np.linspace(0.05, 0.95, SAMPLES) * max(duration, 1)
    images = [f for f in (_frame(video, t, hdr) for t in times) if f is not None]
    if len(images) < SAMPLES // 2:
        raise CaptureError("The video could not be read: send it again, or film it again")
    measures = _measures(images, predict)
    problems, warnings = _judge(measures, mode)
    if duration < 20:
        problems.insert(0, f"the video is {duration:.0f} s long: three slow circles take about a minute")
    if problems:
        raise CaptureError("This video will not make a good model: " + "; ".join(problems) + ".")
    summary = {k: round(float(np.median(v)), 4) for k, v in measures.items() if v and not isinstance(v[0], bool)}
    return {"checked": True, "frames": len(images), "median": summary, "warnings": warnings}
