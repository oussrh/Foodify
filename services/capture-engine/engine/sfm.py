"""COLMAP: camera poses (sparse), then the dense coloured point cloud of the best model only.

Dense stereo runs as three explicit steps rather than inside `automatic_reconstructor`, which
would also densify every disconnected model and mesh the result, work we would throw away.
Option names are checked against COLMAP 4.2.1. `COLMAP_BIN` overrides the executable
(e.g. COLMAP.bat from the Windows release, for running locally).
"""

import os
import re
import subprocess
from pathlib import Path
from typing import Callable

import numpy as np

COLMAP = os.environ.get("COLMAP_BIN", "colmap")


STEP_TIMEOUT_S = 45 * 60


def _tail(log: Path, lines: int = 12) -> str:
    text = log.read_text(encoding="utf-8", errors="replace").splitlines()
    return "\n".join(line for line in text[-lines:] if line.strip())


def _colmap(args: list[str], log: Path) -> None:
    """Run one COLMAP command into the log; a failure or a step over 45 minutes raises with the log's last lines."""
    with open(log, "a", encoding="utf-8") as fh:
        fh.write(f"\n$ colmap {' '.join(args)}\n")
        fh.flush()
        try:
            subprocess.run([COLMAP, *args], stdout=fh, stderr=subprocess.STDOUT, check=True, timeout=STEP_TIMEOUT_S)
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"COLMAP {args[0]} took longer than {STEP_TIMEOUT_S // 60} minutes") from None
        except subprocess.CalledProcessError as error:
            fh.flush()
            raise RuntimeError(f"COLMAP {args[0]} failed (exit {error.returncode}):\n{_tail(log)}") from None


def colmap_version() -> str:
    out = subprocess.run([COLMAP, "help"], capture_output=True, text=True, timeout=60)
    match = re.search(r"COLMAP\s+(\d[\w.\-]*)", out.stdout + out.stderr)
    return match.group(1) if match else "unknown"


def _quat_to_rot(qw: float, qx: float, qy: float, qz: float) -> np.ndarray:
    return np.array([
        [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
        [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
        [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)],
    ])


def read_cameras(model_dir: Path, txt_dir: Path, log: Path) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Camera centres, viewing directions (world space) and image names, from a sparse model."""
    txt_dir.mkdir(parents=True, exist_ok=True)
    _colmap(["model_converter", "--input_path", str(model_dir), "--output_path", str(txt_dir),
             "--output_type", "TXT"], log)
    # Two lines per image (pose, then its 2D points, which may be empty); comments start with '#'.
    lines = [line for line in (txt_dir / "images.txt").read_text().splitlines() if not line.startswith("#")]
    centres, dirs, names = [], [], []
    for line in lines[::2]:
        parts = line.split()
        if len(parts) < 10:
            continue
        qw, qx, qy, qz, tx, ty, tz = map(float, parts[1:8])
        rot = _quat_to_rot(qw, qx, qy, qz)
        centres.append(-rot.T @ np.array([tx, ty, tz]))
        dirs.append(rot.T @ np.array([0.0, 0.0, 1.0]))
        names.append(" ".join(parts[9:]))
    return np.array(centres), np.array(dirs), names


def sparse(images_dir: Path, workspace: Path, mapper: str, log: Path, masks_dir: Path | None = None) -> dict:
    """GPU SIFT, exhaustive matching (fine at ~150 frames), then the incremental or global mapper.

    Explicit steps rather than `automatic_reconstructor`: its `--quality high` turns on
    affine-shape SIFT, which only exists on the CPU (slow, and it crashes on Windows).
    With `masks_dir` (masks.write_masks), features are found on the dish only.
    """
    root = workspace / "sparse"
    root.mkdir(parents=True, exist_ok=True)
    database = str(workspace / "database.db")
    _colmap(["feature_extractor", "--database_path", database, "--image_path", str(images_dir),
             # One camera per folder: video frames and photos (frames.py) have different lenses.
             "--ImageReader.single_camera_per_folder", "1", "--ImageReader.camera_model", "OPENCV",
             "--FeatureExtraction.use_gpu", "1", "--SiftExtraction.max_num_features", "8192",
             *(["--ImageReader.mask_path", str(masks_dir)] if masks_dir else [])], log)
    _colmap(["exhaustive_matcher", "--database_path", database,
             "--FeatureMatching.use_gpu", "1", "--FeatureMatching.guided_matching", "1"], log)
    _colmap(["global_mapper" if mapper == "global" else "mapper", "--database_path", database,
             "--image_path", str(images_dir), "--output_path", str(root)], log)

    models = sorted(p for p in root.iterdir() if p.is_dir())
    if not models:
        raise RuntimeError("COLMAP registered no cameras; see colmap.log")

    # A disconnected capture gives several models; keep the one with the most cameras.
    best, centres, dirs, names = models[0], np.empty((0, 3)), np.empty((0, 3)), []
    for model in models:
        c, d, n = read_cameras(model, workspace / "txt" / model.name, log)
        if len(c) > len(centres):
            best, centres, dirs, names = model, c, d, n
    return {"models": len(models), "model": best, "registered": len(centres),
            "centres": centres, "dirs": dirs, "names": names}


def dense(images_dir: Path, poses: dict, workspace: Path, max_size: int, views: int, log: Path,
          mask: Callable[[Path, list[str], Path], object] | None = None) -> Path:
    """Depth maps for every photo and an evenly spaced subset of the video frames, fused into one
    coloured cloud. With `mask` (masks.write_masks with its model), only the dish is fused: the
    masks are made on the undistorted images, so they line up with the depth maps.

    Depth estimation is the slowest stage by far (two passes per view); neighbouring video frames
    add little to a dish, so it runs on `views` images in all, with 10 source images each.
    """
    out = workspace / "dense"
    stills = sorted(n for n in poses["names"] if n.startswith("stills/"))
    frames = sorted(n for n in poses["names"] if not n.startswith("stills/"))
    picks = np.linspace(0, len(frames) - 1, min(max(views - len(stills), 1), len(frames))).round().astype(int) if frames else []
    subset = stills + [frames[i] for i in picks]
    image_list = workspace / "dense_images.txt"
    image_list.write_text("\n".join(dict.fromkeys(subset)) + "\n")
    _colmap(["image_undistorter", "--image_path", str(images_dir), "--input_path", str(poses["model"]),
             "--output_path", str(out), "--output_type", "COLMAP", "--max_image_size", str(max_size),
             "--image_list_path", str(image_list), "--num_patch_match_src_images", "10"], log)
    _colmap(["patch_match_stereo", "--workspace_path", str(out), "--workspace_format", "COLMAP",
             "--PatchMatchStereo.geom_consistency", "1", "--PatchMatchStereo.allow_missing_files", "1"], log)
    fusion_masks = []
    if mask:
        mask(out / "images", list(dict.fromkeys(subset)), out / "masks")
        fusion_masks = ["--StereoFusion.mask_path", str(out / "masks")]
    fused = out / "fused.ply"
    _colmap(["stereo_fusion", "--workspace_path", str(out), "--workspace_format", "COLMAP",
             "--input_type", "geometric", "--output_path", str(fused), *fusion_masks], log)
    if not fused.exists():
        raise RuntimeError("dense reconstruction produced no fused.ply; see colmap.log")
    return fused
