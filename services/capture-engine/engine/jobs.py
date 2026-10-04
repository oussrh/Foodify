"""A job's life on disk, shared by every backend (Docker's LocalBackend, Modal) and the worker.

A job is a folder: input/<files>, params.json, status.json, output/*, work/ (scratch, removed once
the job succeeds). status.json is the one source of truth for where a job is, written atomically
(a temp file, then a rename), so a reader never sees half of it. While a job runs, a heartbeat
rewrites it every minute: a running job whose heartbeat stops (a killed process, a Modal timeout)
is read as failed instead of running forever.
"""

import json
import os
import shutil
import threading
import time
import traceback
from pathlib import Path

HEARTBEAT_S = 60
STALE_S = 10 * 60
INTERRUPTED = "The engine stopped while it was working on this video (it was restarted). Send the video again."
STALLED = "The engine stopped working on this video without finishing. Send the video again."


def write_json(path: Path, value: dict) -> None:
    """Write `value` so that a concurrent reader sees the old file or the new one, never a part."""
    tmp = path.with_name(f".{path.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    tmp.write_text(json.dumps(value))
    os.replace(tmp, path)


def read_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def write_status(job_dir: Path, state: str, stage: str | None = None) -> None:
    write_json(job_dir / "status.json", {"state": state, "stage": stage, "updated": int(time.time())})


def fail(job_dir: Path, reason: str) -> None:
    """End a job with `reason`, which Foodify shows the manager."""
    (job_dir / "output").mkdir(parents=True, exist_ok=True)
    write_json(job_dir / "output" / "report.json", {"status": "failed", "error": reason, "warnings": []})
    write_status(job_dir, "failed")


def current_status(job_dir: Path, now: float | None = None) -> dict | None:
    """The job's status, failing a running one whose heartbeat has stopped."""
    status = read_json(job_dir / "status.json")
    if status and status["state"] == "running" and (now or time.time()) - status.get("updated", 0) > STALE_S:
        fail(job_dir, STALLED)
        status = read_json(job_dir / "status.json")
    return status


def _heartbeat(job_dir: Path, stage: list, on_change, stop: threading.Event) -> None:
    while not stop.wait(HEARTBEAT_S):
        write_status(job_dir, "running", stage[0])
        on_change()


def run_job(root: Path, job: str, on_change=lambda: None) -> None:
    """Process a job whose files and params are on disk; status.json follows each stage."""
    from .pipeline import Params, run  # heavy imports (open3d, pxr) only where the work happens

    job_dir = root / job
    stage: list = [None]
    stop = threading.Event()
    beat = threading.Thread(target=_heartbeat, args=(job_dir, stage, on_change, stop), daemon=True)
    try:
        params = read_json(job_dir / "params.json") or {}

        def on_stage(name: str) -> None:
            stage[0] = name
            write_status(job_dir, "running", name)
            on_change()

        on_stage(None)
        beat.start()
        report = run(job_dir / "input", job_dir, Params(**params), on_stage=on_stage)
        if report["status"] == "ok":
            shutil.rmtree(job_dir / "work", ignore_errors=True)  # gigabytes of depth maps
            write_status(job_dir, "done")
        else:
            write_status(job_dir, "failed")
    except Exception:  # a job that cannot even start still ends, with the reason on disk
        (job_dir / "output").mkdir(parents=True, exist_ok=True)
        (job_dir / "output" / "traceback.txt").write_text(traceback.format_exc())
        fail(job_dir, "The engine could not process this capture. Send it again; if it fails again, tell support.")
    finally:
        stop.set()
    on_change()


def recover(root: Path) -> list[str]:
    """At startup: a job left running was cut off and is failed; a queued one is returned to be
    started again, oldest first."""
    queued = []
    for status_path in root.glob("*/status.json"):
        status = read_json(status_path)
        if not status:
            continue
        if status["state"] == "running":
            fail(status_path.parent, INTERRUPTED)
        elif status["state"] == "queued":
            queued.append((status.get("updated", 0), status_path.parent.name))
    return [job for _, job in sorted(queued)]


def prune(root: Path, days: int, now: float | None = None) -> list[str]:
    """Delete finished jobs (done or failed) last touched more than `days` ago."""
    cutoff = (now or time.time()) - days * 86400
    removed = []
    for status_path in root.glob("*/status.json"):
        status = read_json(status_path)
        if status and status["state"] in ("done", "failed") and status.get("updated", 0) < cutoff:
            shutil.rmtree(status_path.parent, ignore_errors=True)
            removed.append(status_path.parent.name)
    return removed
