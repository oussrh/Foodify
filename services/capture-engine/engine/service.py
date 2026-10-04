"""The HTTP API Foodify talks to. The same app runs in Docker and on Modal; only the Backend differs.

Authentication, one shared secret (CAPTURE_ENGINE_SECRET), two forms:
- Foodify's server calls carry `Authorization: Bearer <secret>`.
- The browser's calls (sending each file, loading the result into the 3D preview) carry a URL
  Foodify signed: `?exp=<unix seconds>&sig=<hex HMAC-SHA256 of "METHOD path name exp">`, where
  `name` is the file being sent (empty for a GET). A signature is good for one method on one path
  and, for an upload, one file name, until it expires.

    PUT  /jobs/{id}/source?name=capture.mp4&exp&sig   browser: the video as the raw body; then
         /jobs/{id}/source?name=still_1.jpg&exp&sig   each photo the same way (up to 12), before start
         ...&part=<n>&parts=<count>                   or a file in pieces, sent in any order and
                                                      joined when the last arrives: a web request on
                                                      Modal ends at 150 s, a whole video can take longer
    POST /jobs/{id}/start                             server: JSON params, starts processing
    GET  /jobs/{id}                                   server: {state, stage, report}
    GET  /jobs/{id}/files/{name}                      server, or a signed URL (the preview)
    GET  /health

Uploads and start are serialised per job, so a start never sees a file half sent and a late upload
never touches a job that has started. The job's life on disk is engine/jobs.py.
"""

import asyncio
import hashlib
import hmac
import os
import re
import shutil
import time
from collections import defaultdict
from pathlib import Path
from typing import Literal, Protocol

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, ValidationError, field_validator

from .frames import VIDEO_EXTS
from .jobs import current_status, read_json, write_json, write_status

JOB_ID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
SIGNATURE = re.compile(r"^[0-9a-f]{64}$")
STILL_NAME = re.compile(r"^still_([1-9]|1[0-2])\.(jpg|jpeg|png)$")
LOGO_URL = re.compile(r"^https://res\.cloudinary\.com/[\w-]+/image/upload/[^\s?#]+$")
FILES = {"dish.glb": "model/gltf-binary", "dish.usdz": "model/vnd.usdz+zip", "texture.jpg": "image/jpeg", "base.jpg": "image/jpeg"}
MAX_UPLOAD_BYTES = 2 * 1024 ** 3  # the video and the photos together
MAX_URL_LIFETIME_S = 24 * 3600
MAX_PARTS = 1000
PARTS_DIR = ".parts"  # input/.parts/<name>/<n>, until the file is whole


class StartParams(BaseModel):
    """What Foodify may set for a job; anything else in the body is ignored."""

    model_config = {"extra": "ignore"}
    plate_cm: float = Field(ge=5, le=80)
    mode: Literal["walkaround", "turntable"] = "walkaround"
    base_text: str = Field(default="", max_length=60)
    base_logo: str = ""
    base_color: str = ""

    @field_validator("base_logo")
    @classmethod
    def _cloudinary_only(cls, value: str) -> str:
        # The server fetches this address: only the restaurant's images on Cloudinary, never a
        # path on this machine or an arbitrary host (base.py fetches without following redirects).
        if value and not LOGO_URL.match(value):
            raise ValueError("base_logo must be an image on https://res.cloudinary.com")
        return value

    @field_validator("base_color")
    @classmethod
    def _hex(cls, value: str) -> str:
        if value and not re.fullmatch(r"#?[0-9a-fA-F]{6}", value):
            raise ValueError("base_color must be #rrggbb")
        return value


class Backend(Protocol):
    root: Path

    def sync(self) -> None:
        """See writes made by other containers (a Modal volume reload; nothing locally)."""

    def persist(self) -> None:
        """Make this container's writes visible to the others (a Modal volume commit)."""

    def start(self, job: str) -> None:
        """Process the job somewhere, without waiting for it."""


def sign(secret: str, method: str, path: str, exp: int, name: str = "") -> str:
    return hmac.new(secret.encode(), f"{method} {path} {name} {exp}".encode(), hashlib.sha256).hexdigest()


def _job_dir(backend: Backend, job: str) -> Path:
    if not JOB_ID.match(job):
        raise HTTPException(404, "unknown job")
    return backend.root / job


def _check_bearer(request: Request, secret: str) -> bool:
    header = request.headers.get("authorization", "")
    return hmac.compare_digest(header.encode(), f"Bearer {secret}".encode())


def _check_signature(request: Request, secret: str) -> bool:
    sig = request.query_params.get("sig", "")
    try:
        exp = int(request.query_params.get("exp", ""))
    except ValueError:
        return False
    if not SIGNATURE.match(sig) or not time.time() < exp <= time.time() + MAX_URL_LIFETIME_S:
        return False
    name = request.query_params.get("name", "") if request.method == "PUT" else ""
    return hmac.compare_digest(sign(secret, request.method, request.url.path, exp, name), sig)


def _require(request: Request, secret: str, signed_ok: bool = False) -> None:
    if _check_bearer(request, secret) or (signed_ok and _check_signature(request, secret)):
        return
    raise HTTPException(401, "not authorised")


def _source_name(name: str) -> str:
    """What an uploaded file is stored as: the video as capture.<ext>, a photo as still_<n>.<ext>."""
    suffix = Path(name).suffix.lower()
    if suffix in VIDEO_EXTS:
        return f"capture{suffix}"
    if STILL_NAME.match(name.lower()):
        return name.lower()
    raise HTTPException(415, f"send the video ({', '.join(sorted(VIDEO_EXTS))}) or a photo named still_<1-12>.jpg")


def _has_video(inputs: Path) -> bool:
    return inputs.exists() and any(f.name.startswith("capture.") and f.suffix in VIDEO_EXTS for f in inputs.iterdir())


async def _receive(request: Request, target: Path, allowed: int) -> int:
    """Stream the request body to disk, refusing more than `allowed` bytes. A send cut off midway
    leaves nothing behind, so it can be sent again."""
    size = 0
    partial = target.with_name(target.name + ".part")
    try:
        fh = open(partial, "xb")  # one sender at a time per file
    except FileExistsError:
        raise HTTPException(409, f"{target.name} is already being sent") from None
    try:
        with fh:
            async for chunk in request.stream():
                size += len(chunk)
                if size > allowed:
                    raise HTTPException(413, "the video and photos come to more than 2 GB")
                fh.write(chunk)
    except BaseException:  # too large, or the connection dropped
        partial.unlink(missing_ok=True)
        raise
    partial.replace(target)
    return size


def _piece(request: Request) -> tuple[int, int] | None:
    """`(part, parts)` for a file sent in pieces, None for a whole file."""
    part, parts = request.query_params.get("part"), request.query_params.get("parts")
    if part is None and parts is None:
        return None
    try:
        n, count = int(part or ""), int(parts or "")
    except ValueError:
        raise HTTPException(400, "part and parts must be numbers") from None
    if not 0 <= n < count <= MAX_PARTS:
        raise HTTPException(400, f"part must be 0 to parts - 1, and parts at most {MAX_PARTS}")
    return n, count


def _join(pieces: Path, count: int, target: Path) -> bool:
    """The file whole, once every piece is there; False while some are missing."""
    names = [f"{n:05d}" for n in range(count)]
    if not all((pieces / name).exists() for name in names):
        return False
    joined = target.with_name(target.name + ".part")
    with open(joined, "wb") as out:
        for name in names:
            with open(pieces / name, "rb") as fh:
                shutil.copyfileobj(fh, out, 8 * 1024 * 1024)
    joined.replace(target)
    shutil.rmtree(pieces)
    return True


def _sent(inputs: Path) -> int:
    return sum(f.stat().st_size for f in inputs.rglob("*") if f.is_file())


async def _upload(backend: Backend, job_dir: Path, request: Request) -> dict:
    target = _source_name(request.query_params.get("name", ""))
    backend.sync()
    status = current_status(job_dir)
    if status and status["state"] != "uploaded":
        raise HTTPException(409, "this job has started; it takes no more files")
    inputs = job_dir / "input"
    inputs.mkdir(parents=True, exist_ok=True)
    if (inputs / target).exists() or (target.startswith("capture.") and _has_video(inputs)):
        raise HTTPException(409, f"this job already has {target}")
    allowed = MAX_UPLOAD_BYTES - _sent(inputs)
    piece = _piece(request)
    if piece is None:
        size, whole = await _receive(request, inputs / target, allowed), True
    else:
        pieces = inputs / PARTS_DIR / target
        pieces.mkdir(parents=True, exist_ok=True)
        again = pieces / f"{piece[0]:05d}"  # a piece sent twice replaces the first
        size = await _receive(request, again, allowed + (again.stat().st_size if again.exists() else 0))
        whole = _join(pieces, piece[1], inputs / target)
    write_status(job_dir, "uploaded")
    backend.persist()
    return {"bytes": size, "stored": target, "whole": whole}


async def _start(backend: Backend, job_dir: Path, request: Request) -> dict:
    backend.sync()
    status = current_status(job_dir)
    if not status or status["state"] != "uploaded":
        raise HTTPException(409, f"cannot start a job that is {status['state'] if status else 'not uploaded'}")
    inputs = job_dir / "input"
    if any(f.suffix == ".part" for f in inputs.iterdir()) or any((inputs / PARTS_DIR).glob("*")):
        raise HTTPException(409, "a file is still being sent")
    if not _has_video(inputs):
        raise HTTPException(409, "the video has not been sent yet")
    try:
        params = StartParams.model_validate(await request.json())
    except (ValueError, ValidationError) as error:
        raise HTTPException(422, f"invalid parameters: {error}") from None
    write_json(job_dir / "params.json", {k: v for k, v in params.model_dump().items() if v != ""})
    write_status(job_dir, "queued")
    backend.persist()
    backend.start(job_dir.name)
    return {"state": "queued"}


def _routes(api: FastAPI, backend: Backend, secret: str) -> None:
    locks: dict[str, asyncio.Lock] = defaultdict(asyncio.Lock)

    @api.get("/health")
    def health() -> dict:
        return {"ok": True}

    @api.put("/jobs/{job}/source")
    async def upload(job: str, request: Request) -> dict:
        _require(request, secret, signed_ok=True)
        job_dir = _job_dir(backend, job)
        async with locks[job]:
            return await _upload(backend, job_dir, request)

    @api.post("/jobs/{job}/start", status_code=202)
    async def start(job: str, request: Request) -> dict:
        _require(request, secret)
        job_dir = _job_dir(backend, job)
        async with locks[job]:
            return await _start(backend, job_dir, request)

    @api.get("/jobs/{job}")
    def status(job: str, request: Request) -> JSONResponse:
        _require(request, secret)
        job_dir = _job_dir(backend, job)
        backend.sync()
        status = current_status(job_dir)
        if status is None:
            return JSONResponse({"state": "waiting", "stage": None, "report": None})
        report = read_json(job_dir / "output" / "report.json") if status["state"] in ("done", "failed") else None
        return JSONResponse({**status, "report": report})

    @api.get("/jobs/{job}/files/{name}")
    def file(job: str, name: str, request: Request) -> FileResponse:
        _require(request, secret, signed_ok=True)
        job_dir = _job_dir(backend, job)
        if name not in FILES:
            raise HTTPException(404, "unknown file")
        backend.sync()
        path = job_dir / "output" / name
        if not path.exists():
            raise HTTPException(404, "not produced yet")
        return FileResponse(path, media_type=FILES[name])


def create_app(backend: Backend) -> FastAPI:
    secret = os.environ.get("CAPTURE_ENGINE_SECRET", "")
    if len(secret) < 32:
        raise RuntimeError("set CAPTURE_ENGINE_SECRET (at least 32 characters, the same value as Foodify's)")
    origins = [o.strip() for o in os.environ.get("CAPTURE_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]

    api = FastAPI(title="Foodify capture engine", docs_url=None, redoc_url=None)
    api.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "PUT"],
                       allow_headers=["content-type"], max_age=3600)
    _routes(api, backend, secret)
    return api
