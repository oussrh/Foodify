"""Run the engine's HTTP API on this machine (in Docker, or directly), one dish at a time, on the local GPU.

    python serve.py --port 8787 --root ./jobs       # CAPTURE_ENGINE_SECRET must be set

In Docker this is the container's command (see Dockerfile and docker-compose.yml).
"""

import argparse
import os
import signal
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import uvicorn

from engine.jobs import fail, prune, read_json, recover
from engine.service import create_app

HERE = Path(__file__).resolve().parent
JOB_TIMEOUT_S = 2 * 3600
KEEP_DAYS = 14


class LocalBackend:
    """Jobs on a local disk. One job at a time (one GPU), each in its own process (engine/worker.py)
    with a time limit, so a stuck COLMAP or a native crash costs that job and nothing else. At
    startup: finished jobs older than two weeks are deleted, a job left running is failed, and the
    queued ones are started again in order."""

    def __init__(self, root: Path):
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        self._worker = ThreadPoolExecutor(max_workers=1)
        for job in prune(self.root, KEEP_DAYS):
            print(f"deleted job {job}: finished more than {KEEP_DAYS} days ago", flush=True)
        for job in recover(self.root):
            print(f"queued again: {job}", flush=True)
            self.start(job)

    def sync(self) -> None:
        pass

    def persist(self) -> None:
        pass

    def start(self, job: str) -> None:
        self._worker.submit(self._run, job)

    def _run(self, job: str) -> None:
        job_dir = self.root / job
        posix = os.name == "posix"
        process = subprocess.Popen([sys.executable, "-m", "engine.worker", str(self.root), job], cwd=HERE, start_new_session=posix)
        try:
            code = process.wait(timeout=JOB_TIMEOUT_S)
        except subprocess.TimeoutExpired:
            if posix:
                os.killpg(process.pid, signal.SIGKILL)  # COLMAP and ffmpeg with it
            else:
                process.kill()
            process.wait()
            fail(job_dir, "Processing took longer than 2 hours and was stopped. Film again: three slow circles of 20-30 s each.")
            return
        status = read_json(job_dir / "status.json")
        if not status or status["state"] not in ("done", "failed"):
            fail(job_dir, f"The engine stopped unexpectedly on this capture (exit {code}). Send it again.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8787)
    parser.add_argument("--root", default="jobs", help="where jobs are kept")
    args = parser.parse_args()
    uvicorn.run(create_app(LocalBackend(Path(args.root).resolve())), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
