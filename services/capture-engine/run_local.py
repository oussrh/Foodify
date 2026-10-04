"""Process one dish on this machine's NVIDIA GPU, at no cost. Same pipeline as the Modal app.

    python run_local.py --source dish.mp4 --plate-cm 27 --colmap C:\\tools\\colmap\\COLMAP.bat

Needs ffmpeg on PATH and COLMAP's CUDA build (the Windows release zip, or `colmap` on PATH).
"""

import argparse
import json
import os
import time
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", required=True, help="a video, a folder of videos, or a folder of photos")
    parser.add_argument("--plate-cm", type=float, default=27.0)
    parser.add_argument("--frames", type=int, default=150)
    parser.add_argument("--mapper", default="incremental")
    parser.add_argument("--triangles", type=int, default=50_000)
    parser.add_argument("--base-logo", default="", help="logo for the underside: PNG/JPEG file or URL")
    parser.add_argument("--base-text", default="", help="restaurant name for the underside, if no logo")
    parser.add_argument("--base-color", default="", help="underside colour #rrggbb (default: the plate's)")
    parser.add_argument("--debug", action="store_true")
    parser.add_argument("--colmap", help="COLMAP executable (default: COLMAP_BIN, then `colmap`)")
    parser.add_argument("--out", default="out")
    args = parser.parse_args()

    if args.colmap:
        os.environ["COLMAP_BIN"] = args.colmap
    from engine.pipeline import Params, run  # after COLMAP_BIN is set

    src = Path(args.source).resolve()
    job_dir = Path(args.out) / f"{src.stem}-{time.strftime('%Y%m%d-%H%M%S')}"
    params = Params(plate_cm=args.plate_cm, frames=args.frames, mapper=args.mapper,
                    triangles=args.triangles, base_logo=args.base_logo, base_text=args.base_text,
                    base_color=args.base_color, debug=args.debug)
    report = run(src, job_dir, params)

    keys = ("status", "error", "warnings", "colmap", "alignment", "asset", "seconds")
    print(json.dumps({k: report.get(k) for k in keys}, indent=2))
    print(f"\nResults in {(job_dir / 'output').resolve()}")


if __name__ == "__main__":
    main()
