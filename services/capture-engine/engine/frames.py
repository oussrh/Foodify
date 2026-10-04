"""Turn a capture into the frames COLMAP reconstructs from.

A capture is one video, a folder of videos (one per circle is fine), or a folder of photos.
"""

import json
import subprocess
from pathlib import Path

import cv2
import numpy as np

VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".mkv"}
PHOTO_EXTS = {".jpg", ".jpeg", ".png"}
HDR_TRANSFERS = {"arib-std-b67", "smpte2084"}  # HLG (iPhone and Samsung HDR video) and PQ
# HDR frames read as plain 8-bit come out grey and washed out: map them to ordinary colours first.
TONEMAP = ("zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=mobius:desat=0,"
           "zscale=t=bt709:m=bt709:r=tv,format=yuv420p")


def _sharpness(path: Path) -> float:
    """Variance of the Laplacian: higher is sharper. Only meaningful relative to frames of the same clip."""
    gray = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if gray is None:
        return 0.0
    small = cv2.resize(gray, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)
    return float(cv2.Laplacian(small, cv2.CV_64F).var())


MAX_CANDIDATES = 600  # frames read from a video at most; a long clip is sampled more sparsely


def _probe(video: Path) -> tuple[dict, float]:
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
         "stream=width,height,color_transfer:format=duration", "-of", "json", str(video)],
        capture_output=True, text=True, timeout=120)
    info = json.loads(probe.stdout or "{}")
    if probe.returncode != 0 or not info.get("streams"):
        raise ValueError(f"{video.name} could not be read as a video: the file is damaged, incomplete, or not a video")
    return info["streams"][0], float(info.get("format", {}).get("duration", 0) or 0)


def _video_warnings(stream: dict, duration: float, video: Path) -> list[str]:
    warnings = []
    if stream.get("color_transfer") in HDR_TRANSFERS:
        warnings.append(f"{video.name}: HDR video, converted to ordinary colours; turn HDR video off for truer colours.")
    if max(stream["width"], stream["height"]) < 1920:
        warnings.append(f"{video.name}: {stream['width']}x{stream['height']}; record in 4K.")
    if duration < 45:
        warnings.append(f"{video.name}: {duration:.0f} s long; three slow circles (low, middle, high) take 60-90 s.")
    return warnings


def _extract_video(video: Path, out_dir: Path, fps: float, long_edge: int, hdr: bool = False) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    scale = f"scale=w={long_edge}:h={long_edge}:force_original_aspect_ratio=decrease:force_divisible_by=2"
    chain = f"fps={fps},{TONEMAP + ',' if hdr else ''}{scale}"
    done = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(video), "-an", "-vf", chain, "-q:v", "2",
         str(out_dir / "c_%05d.jpg")],
        capture_output=True, text=True, timeout=30 * 60)
    if done.returncode != 0:
        raise ValueError(f"{video.name}: its frames could not be read; the file may be damaged")
    return sorted(out_dir.glob("c_*.jpg"))


def _resize_photos(photos: list[Path], out_dir: Path, long_edge: int, warnings: list[str]) -> list[Path]:
    """The photos that could be read, scaled down to `long_edge`; one that could not is named in `warnings`."""
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for i, src in enumerate(photos):
        img = cv2.imread(str(src), cv2.IMREAD_COLOR)  # applies EXIF orientation
        if img is None:
            warnings.append(f"{src.name} could not be read as a JPEG or PNG photo and was left out")
            continue
        factor = long_edge / max(img.shape[:2])
        if factor < 1:
            img = cv2.resize(img, None, fx=factor, fy=factor, interpolation=cv2.INTER_AREA)
        dst = out_dir / f"c_{i:05d}.jpg"
        cv2.imwrite(str(dst), img, [cv2.IMWRITE_JPEG_QUALITY, 95])
        written.append(dst)
    return written


def _keep_sharpest(candidates: list[Path], count: int) -> list[Path]:
    """Split the sequence into `count` time buckets and keep the sharpest frame of each."""
    if len(candidates) <= count:
        return candidates
    buckets = np.array_split(np.arange(len(candidates)), count)
    return [candidates[max(b, key=lambda i: _sharpness(candidates[i]))] for b in buckets]


def _sources(source: Path) -> tuple[list[Path], list[Path]]:
    files = sorted(source.iterdir()) if source.is_dir() else [source]
    videos = [f for f in files if f.suffix.lower() in VIDEO_EXTS]
    photos = [f for f in files if f.suffix.lower() in PHOTO_EXTS]
    if not videos and not photos:
        raise ValueError(f"{source.name}: no video ({', '.join(sorted(VIDEO_EXTS))}) or JPEG/PNG photo found")
    return videos, photos


VIDEO_DIR, STILLS_DIR = "video", "stills"


def _place(paths: list[Path], folder: Path, stem: str) -> None:
    folder.mkdir(parents=True, exist_ok=True)
    for i, path in enumerate(paths):
        path.replace(folder / f"{stem}_{i:04d}.jpg")


def prepare_images(source: Path, images_dir: Path, scratch_dir: Path, count: int,
                   long_edge: int = 1920, fps: float = 5.0) -> dict:
    """`count` images in all, in two folders so COLMAP gives each its own camera (a phone's video and
    its photos do not share a lens model): every photo in `stills/`, always kept, and the sharpest
    video frames in `video/` for the rest. Photos without a video are the capture itself, and go
    through the same selection as frames."""
    videos, photos = _sources(source)
    warnings: list[str] = []
    frames: list[Path] = []
    for i, video in enumerate(videos):
        stream, duration = _probe(video)
        warnings += _video_warnings(stream, duration, video)
        rate = min(fps, MAX_CANDIDATES / duration) if duration > 0 else fps
        hdr = stream.get("color_transfer") in HDR_TRANSFERS
        frames += _extract_video(video, scratch_dir / f"video_{i}", rate, long_edge, hdr)
    stills = _resize_photos(photos, scratch_dir / "photos", long_edge, warnings) if photos else []
    if not videos:
        frames, stills = stills, []
    if len(frames) + len(stills) < 30:
        raise ValueError(f"only {len(frames) + len(stills)} usable images; a dish needs 60 or more")

    kept = _keep_sharpest(frames, max(count - len(stills), 1))
    _place(kept, images_dir / VIDEO_DIR, "frame")
    _place(stills, images_dir / STILLS_DIR, "still")
    return {"videos": len(videos), "photos": len(photos), "candidates": len(frames),
            "kept": len(kept) + len(stills), "stills": len(stills), "warnings": warnings}
