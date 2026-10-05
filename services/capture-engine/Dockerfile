# The capture engine with its HTTP API, on the local NVIDIA GPU (Docker Desktop + WSL2).
# Same base and the same Python packages as the Modal image in app.py, so a dish behaves the same
# on a laptop and in the cloud.
FROM colmap/colmap:20260929.8468

ENV DEBIAN_FRONTEND=noninteractive \
    QT_QPA_PLATFORM=offscreen \
    PIP_BREAK_SYSTEM_PACKAGES=1 \
    PYTHONUNBUFFERED=1

# Ubuntu 24.04's Python 3.12 (what requirements.txt is tested on), ffmpeg for video, a font for the
# name on the base; the rest are what Open3D's Linux wheel loads on import.
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 python3-pip ffmpeg fonts-dejavu-core \
        libgl1 libegl1 libgomp1 libusb-1.0-0 libx11-6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
# PyTorch for SAM 2 (labels.py), the CPU build: the GPU is COLMAP's, and the CUDA build is gigabytes.
RUN pip3 install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch==2.14.1 torchvision==0.29.1
RUN pip3 install --no-cache-dir -r requirements.txt

# The model that cuts the dish out of a turntable capture (IS-Net, Apache-2.0), pinned by hash.
ENV CAPTURE_SEGMENT_MODEL=/models/isnet-general-use.onnx
ADD --checksum=sha256:60920e99c45464f2ba57bee2ad08c919a52bbf852739e96947fbb4358c0d964a \
    https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx /models/isnet-general-use.onnx

# SAM 2.1 tiny (Meta, Apache-2.0): which pixels are the plate (labels.py). Pinned to a revision.
ENV CAPTURE_SAM_MODEL=/models/sam2.1-hiera-tiny
RUN python3 -c "from huggingface_hub import snapshot_download; snapshot_download( \
        'facebook/sam2.1-hiera-tiny', revision='de431c4043854a71d8101e17995dfe596bf101a5', \
        local_dir='/models/sam2.1-hiera-tiny', allow_patterns=['config.json', 'model.safetensors', \
        'preprocessor_config.json', 'processor_config.json', 'video_preprocessor_config.json'])"

COPY engine ./engine
COPY serve.py .
# Fail while building, not on the first dish.
RUN python3 -c "import open3d, xatlas, cv2, scipy, PIL, fastapi, uvicorn; from pxr import Usd, UsdValidation; from engine import labels, masks; masks.load(); assert labels.load()" \
    && colmap help | head -n 1 && ffmpeg -version | head -n 1

EXPOSE 8787
CMD ["python3", "serve.py", "--host", "0.0.0.0", "--port", "8787", "--root", "/jobs"]
