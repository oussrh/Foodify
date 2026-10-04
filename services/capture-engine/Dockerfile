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
RUN pip3 install --no-cache-dir -r requirements.txt

COPY engine ./engine
COPY serve.py .
# Fail while building, not on the first dish.
RUN python3 -c "import open3d, xatlas, cv2, scipy, PIL, fastapi, uvicorn; from pxr import Usd, UsdValidation" \
    && colmap help | head -n 1 && ffmpeg -version | head -n 1

EXPOSE 8787
CMD ["python3", "serve.py", "--host", "0.0.0.0", "--port", "8787", "--root", "/jobs"]
