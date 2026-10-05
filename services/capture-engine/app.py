"""Modal app: process one dish capture on a serverless L4 GPU, billed per second, idle costs nothing.

    modal run app.py --source dish.mp4 --plate-cm 27
    modal run app.py --source captures/dish-folder --plate-cm 24 --debug

The capture is uploaded to a Modal volume, processed on the GPU, and the results are downloaded
to ./out/<job>/ (dish.glb, dish.usdz, texture.jpg, report.json, colmap.log).
"""

import json
import time
from pathlib import Path

import modal

HERE = Path(__file__).parent
COLMAP_IMAGE = "colmap/colmap:20260929.8468"  # COLMAP 4.2.1, CUDA 12.9.1, Ubuntu 24.04

app = modal.App("foodify-capture")
# Version 2: the API and each dish's GPU container write distinct files of the same jobs at once.
volume = modal.Volume.from_name("foodify-capture-jobs", create_if_missing=True, version=2)
KEEP_DAYS = 14  # as serve.py: finished jobs are deleted after two weeks
VOLUME_PATH = Path("/captures")

image = (
    modal.Image.from_registry(COLMAP_IMAGE, add_python="3.12")  # requirements.txt is tested on 3.12
    # ffmpeg for video, a font for the name on the base; the rest are what Open3D's Linux wheel
    # loads on import.
    .apt_install("ffmpeg", "fonts-dejavu-core", "curl", "ca-certificates", "libgl1", "libegl1", "libgomp1", "libusb-1.0-0", "libx11-6")
    # PyTorch for SAM 2 (labels.py), the CPU build, as in the Dockerfile.
    .pip_install("torch==2.14.1", "torchvision==0.29.1", index_url="https://download.pytorch.org/whl/cpu")
    .pip_install_from_requirements(str(HERE / "requirements.txt"))
    # The model that cuts the dish out of a turntable capture (IS-Net, Apache-2.0), as in the Dockerfile.
    .run_commands(
        "mkdir -p /models && curl -fsSL -o /models/isnet-general-use.onnx "
        "https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx",
        "echo '60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a  /models/isnet-general-use.onnx' | sha256sum -c -",
        "python -c \"from huggingface_hub import snapshot_download; snapshot_download('facebook/sam2.1-hiera-tiny', "
        "revision='de431c4043854a71d8101e17995dfe596bf101a5', local_dir='/models/sam2.1-hiera-tiny', "
        "allow_patterns=['config.json', 'model.safetensors', 'preprocessor_config.json', 'processor_config.json', "
        "'video_preprocessor_config.json'])\"",
    )
    .env({"QT_QPA_PLATFORM": "offscreen", "CAPTURE_SEGMENT_MODEL": "/models/isnet-general-use.onnx",
          "CAPTURE_SAM_MODEL": "/models/sam2.1-hiera-tiny"})
    # Fail while building the image, not after a 1 GB upload.
    .run_commands(
        "colmap help | head -n 3",
        "ffmpeg -version | head -n 1",
        "python -c 'import open3d, xatlas, cv2, scipy, PIL, fastapi; from pxr import Usd, UsdValidation; print(\"deps ok\")'",
    )
    .add_local_python_source("engine")
)


@app.function(image=image, gpu="L4", cpu=8, memory=32768, timeout=90 * 60, volumes={VOLUME_PATH: volume})
def process(job: str, source_name: str, params: dict) -> dict:
    from engine.pipeline import Params, run

    volume.reload()
    job_dir = VOLUME_PATH / job
    report = run(job_dir / "input" / source_name, job_dir, Params(**params))
    volume.commit()
    return report


# The HTTP API Foodify calls (engine/service.py), the same one Docker serves. Deploy with
# `modal deploy app.py` after `modal secret create foodify-capture CAPTURE_ENGINE_SECRET=...
# CAPTURE_ALLOWED_ORIGINS=https://<the dashboards' origin>`; Foodify's CAPTURE_ENGINE_URL is then
# the printed https://<workspace>--foodify-capture-api.modal.run.
secret = modal.Secret.from_name("foodify-capture")


@app.function(image=image, gpu="L4", cpu=8, memory=32768, timeout=90 * 60,
              volumes={VOLUME_PATH: volume}, secrets=[secret])
def process_job(job: str) -> None:
    # A Modal timeout or preemption kills this without a word: the job's heartbeat (engine/jobs.py,
    # committed each minute) stops, and the API reads it as failed ten minutes later.
    from engine.jobs import run_job

    volume.reload()
    run_job(VOLUME_PATH, job, on_change=volume.commit)


class ModalBackend:
    """Jobs on the shared volume; each dish on its own GPU container, started per job."""

    root = VOLUME_PATH

    def sync(self) -> None:
        # A reload waits for no open file: while another request is still writing a piece, skip it
        # and read what this container has; the next status poll reloads.
        try:
            volume.reload()
        except RuntimeError as error:  # what Modal raises for it (modal/volume.py, reload)
            if "open files" not in str(error):
                raise

    def persist(self) -> None:
        volume.commit()

    def start(self, job: str) -> None:
        process_job.spawn(job)


# One container: a file's pieces land where the others are, without waiting for a commit. A web
# request on Modal ends at 150 s, which is why the browser sends files in pieces (service.py).
@app.function(image=image, volumes={VOLUME_PATH: volume}, secrets=[secret], timeout=30 * 60,
              max_containers=1, scaledown_window=5 * 60)
@modal.concurrent(max_inputs=20)
@modal.asgi_app()
def api():
    from engine.service import create_app

    return create_app(ModalBackend())


@app.function(image=image, volumes={VOLUME_PATH: volume}, schedule=modal.Period(days=1))
def prune_jobs() -> None:
    """Delete finished jobs after KEEP_DAYS: the videos are the volume's bulk, and it is billed."""
    from engine.jobs import prune

    volume.reload()
    removed = prune(VOLUME_PATH, KEEP_DAYS)
    volume.commit()
    print(f"pruned {len(removed)} job(s)")


@app.local_entrypoint()
def main(source: str, plate_cm: float = 27.0, frames: int = 150, mapper: str = "incremental",
         triangles: int = 50_000, base_logo: str = "", base_text: str = "", base_color: str = "",
         debug: bool = False, out: str = "out"):
    src = Path(source).resolve()
    if not src.exists():
        raise SystemExit(f"{src} does not exist")
    job = f"{src.stem}-{time.strftime('%Y%m%d-%H%M%S')}"
    local_logo = base_logo and not base_logo.startswith(("http://", "https://"))

    print(f"Uploading {src.name} as job {job} ...")
    with volume.batch_upload() as batch:
        if src.is_dir():
            batch.put_directory(str(src), f"/{job}/input/{src.name}")
        else:
            batch.put_file(str(src), f"/{job}/input/{src.name}")
        if local_logo:
            batch.put_file(base_logo, f"/{job}/logo{Path(base_logo).suffix}")
    if local_logo:  # the container reads it from the volume; a URL it fetches itself
        base_logo = str(VOLUME_PATH / job / f"logo{Path(base_logo).suffix}")

    print("Processing on an L4 GPU (typically 10-40 minutes) ...")
    params = {"plate_cm": plate_cm, "frames": frames, "mapper": mapper, "triangles": triangles,
              "base_logo": base_logo, "base_text": base_text, "base_color": base_color, "debug": debug}
    report = process.remote(job, src.name, params)

    local = Path(out) / job
    local.mkdir(parents=True, exist_ok=True)
    for name in report["outputs"]:
        with open(local / name, "wb") as fh:
            for chunk in volume.read_file(f"/{job}/output/{name}"):
                fh.write(chunk)

    keys = ("status", "error", "warnings", "colmap", "alignment", "asset", "seconds")
    print(json.dumps({k: report.get(k) for k in keys}, indent=2))
    print(f"\nResults in {local.resolve()}")
