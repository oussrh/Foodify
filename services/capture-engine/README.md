# Capture engine

The service behind Foodify's **Create the 3D model from a video**: it turns a phone video of a
plated dish, plus a few HD photos, into an AR-ready `dish.glb` (web, Android) and `dish.usdz`
(iPhone). It needs an NVIDIA GPU, so it runs beside Foodify, not on Vercel: in Docker Desktop on a
workstation (free), or on Modal in the cloud (billed per second, nothing between dishes).

Foodify's side is `server/capture/` (the client and the job rows) and `components/capture/` (the
screens). The two meet at the HTTP API below; change both sides in the same pull request.

```
video + photos -> sharpest frames, photos kept -> COLMAP poses + dense stereo (GPU)
  -> table plane, orbit centre, plate edge = scale; tablecloth and clutter cut away
  -> Poisson surface with a closed base -> 50k triangles -> UV atlas -> texture
  -> underside branded with the logo or name -> GLB + USDZ + report.json
```

## Run it for Foodify, locally (Docker Desktop, NVIDIA GPU)

```powershell
cd services\capture-engine          # from the Foodify repository
copy env.example .env               # set CAPTURE_ENGINE_SECRET (32+ characters)
docker compose up -d --build        # http://127.0.0.1:8787, jobs kept in .\jobs
```

In Foodify's `.env`: `CAPTURE_ENGINE_URL="http://localhost:8787"` and the same
`CAPTURE_ENGINE_SECRET`. The dish edit page then shows the capture card.

## The HTTP API (engine/service.py)

| Call | Who | What |
|---|---|---|
| `PUT /jobs/{id}/source?name=capture.mp4&exp&sig` | browser | the video; then `still_<n>.jpg` for each photo, before start |
| `POST /jobs/{id}/start` | Foodify, bearer | JSON params (`plate_cm`, `base_text`, `base_logo` on Cloudinary, `base_color`) |
| `GET /jobs/{id}` | Foodify, bearer | `{state, stage, report}` |
| `GET /jobs/{id}/files/{dish.glb\|dish.usdz\|texture.jpg\|base.jpg}` | bearer, or signed | the results; the 3D preview loads the GLB signed |
| `GET /health` | anyone | `{ok: true}` |

A signed address is `?exp=<unix>&sig=<hex HMAC-SHA256 of "METHOD path name exp">` with the shared
secret; `name` is the uploaded file (empty for a GET), so one address sends one file. Uploads and
start are serialised per job; a start never sees a half-sent file.

A job (`engine/jobs.py`) is a folder: `input/`, `params.json`, `status.json` (written atomically,
with a heartbeat every minute while running), `output/`, `work/` (removed after success). Each job
runs in its own process (`engine/worker.py`) with a two-hour limit; at startup, a job left running
is failed, the queued ones resume, and finished jobs older than 14 days are deleted. A running job
whose heartbeat stopped (a crash, a Modal timeout) reads as failed after ten minutes.

## Run it in the cloud (Modal)

```powershell
pip install modal; modal setup
modal secret create foodify-capture CAPTURE_ENGINE_SECRET=... CAPTURE_ALLOWED_ORIGINS=https://myfoodify.vercel.app
modal deploy app.py                 # prints the API's https address: Foodify's CAPTURE_ENGINE_URL
```

Not yet tried end to end. `modal run app.py --source dish.mp4 --plate-cm 27` processes one capture
from the command line instead.

## Without the API

```powershell
pip install -r requirements.txt
python run_local.py --source dish.mp4 --plate-cm 27 --colmap C:\tools\colmap\COLMAP.bat
```

Needs ffmpeg and COLMAP's CUDA build (4.2.1 or later). `--debug` also writes the cropped dense
cloud and the full-resolution mesh. Results and `report.json` (warnings, timings, size, scale) land
in `out/<job>/output/`.

## Tests

```powershell
python tests/service_test.py        # the API's contract and the job rules, no GPU, seconds
python tests/smoke_test.py          # everything after COLMAP on a synthetic dish, no GPU
python tests/render_capture.py out/synthetic    # a synthetic dish video with known size, for a full run
```

## Layout

| File | Stage |
|---|---|
| `serve.py` | the API on this machine (LocalBackend: one job at a time, each in its own process) |
| `app.py` | Modal: the image, the GPU function, the API |
| `engine/service.py` | the HTTP API |
| `engine/jobs.py`, `engine/worker.py` | a job's life on disk; one job in a process |
| `engine/frames.py` | video → frames (sharpest per time bucket), photos kept, capture warnings |
| `engine/sfm.py` | COLMAP: poses, then dense stereo on the photos and a subset of the frames |
| `engine/mesh.py` | up, centre, scale, crop, Poisson surface with a closed base, decimation |
| `engine/texture.py` | xatlas UV atlas (padded), colour bake |
| `engine/base.py` | the underside: base faces, planar mapping, logo or name on the plate colour |
| `engine/export.py` | GLB writer, USDZ via OpenUSD, USD validation |
| `engine/pipeline.py` | the stages in order, warnings, `report.json` |

## Licences

COLMAP (BSD), Open3D (MIT), xatlas (MIT), OpenUSD (Apache-2.0 modified), OpenCV (Apache-2.0),
SciPy/NumPy (BSD), FastAPI/uvicorn (MIT/BSD), ffmpeg (LGPL, run as a separate program).
