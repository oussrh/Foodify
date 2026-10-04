"""The HTTP API's contract with Foodify, and the job rules behind it (engine/jobs.py): who may call
what, a job's states, the files it serves, and what happens to a job cut off or stalled.

No GPU: the backend's `start` writes a finished job instead of processing one. From the engine's
folder, as a module, so `engine` is importable without touching sys.path:

    python -m tests.service_test
"""

import json
import os
import tempfile
import time
from pathlib import Path

from fastapi.testclient import TestClient

from engine.jobs import INTERRUPTED, STALLED, prune, read_json, recover, write_status
from engine.service import create_app, sign

SECRET = "s" * 40  # create_app reads CAPTURE_ENGINE_SECRET when it is called, in main()
JOB = "0b3c6f1e-6a7d-4d2f-9a51-2f8e1c4b7a90"
BEARER = {"Authorization": f"Bearer {SECRET}"}
LOGO = "https://res.cloudinary.com/demo/image/upload/f_png/v1/logo.svg"


class FakeBackend:
    def __init__(self, root: Path):
        self.root, self.started = root, []

    def sync(self):
        pass

    def persist(self):
        pass

    def start(self, job):
        self.started.append(job)
        out = self.root / job / "output"
        out.mkdir(parents=True)
        (out / "dish.glb").write_bytes(b"glTF-fake")
        (out / "report.json").write_text(json.dumps({"status": "ok", "warnings": []}))
        write_status(self.root / job, "done")


def put(path: str, name: str, lifetime: int = 600, secret: str = SECRET, method: str = "PUT", signed_name: str | None = None) -> str:
    exp = int(time.time()) + lifetime
    sig = sign(secret, method, path, exp, name if signed_name is None else signed_name)
    return f"{path}?name={name}&exp={exp}&sig={sig}"


def get(path: str, lifetime: int = 600) -> str:
    exp = int(time.time()) + lifetime
    return f"{path}?exp={exp}&sig={sign(SECRET, 'GET', path, exp)}"


def check(label: str, got, expected) -> None:
    assert got == expected, f"{label}: expected {expected}, got {got}"
    print(f"ok  {label}")


def signatures(api: TestClient, source: str) -> None:
    check("upload without a signature", api.put(source, content=b"v").status_code, 401)
    check("signed with another secret", api.put(put(source, "a.mp4", secret="x" * 40), content=b"v").status_code, 401)
    check("an expired signature", api.put(put(source, "a.mp4", -5), content=b"v").status_code, 401)
    check("a signature good for a day and a half", api.put(put(source, "a.mp4", 36 * 3600), content=b"v").status_code, 401)
    check("a GET signature does not allow a PUT", api.put(put(source, "a.mp4", method="GET"), content=b"v").status_code, 401)
    check("a signature for one file name does not send another",
          api.put(put(source, "still_5.jpg", signed_name="capture.mp4"), content=b"v").status_code, 401)
    check("a signature that is not hex is refused, not a crash",
          api.put(f"{source}?name=a.mp4&exp={int(time.time()) + 60}&sig=é{'0' * 63}", content=b"v").status_code, 401)


def uploads(api: TestClient, tmp: Path, source: str) -> None:
    check("not a video", api.put(put(source, "a.exe"), content=b"v").status_code, 415)
    check("a job id that is not a uuid", api.get("/jobs/..%2Fetc", headers=BEARER).status_code, 404)
    check("start before any upload", api.post(f"/jobs/{JOB}/start", headers=BEARER, json={"plate_cm": 27}).status_code, 409)
    r = api.put(put(source, "dish.MOV"), content=b"x" * 1000)
    check("signed upload", (r.status_code, r.json()), (200, {"bytes": 1000, "stored": "capture.mov", "whole": True}))
    check("a second video", api.put(put(source, "a.mp4"), content=b"v").status_code, 409)
    r = api.put(put(source, "still_1.JPG"), content=b"p" * 10)
    check("a photo beside the video", (r.status_code, r.json()["stored"]), (200, "still_1.jpg"))
    check("the same photo twice", api.put(put(source, "still_1.jpg"), content=b"p").status_code, 409)
    check("a thirteenth photo", api.put(put(source, "still_13.jpg"), content=b"p").status_code, 415)
    (tmp / JOB / "input" / "still_2.jpg.part").write_bytes(b"half")
    check("start while a file is half sent", api.post(f"/jobs/{JOB}/start", headers=BEARER, json={"plate_cm": 27}).status_code, 409)
    check("a second sender of a file being sent", api.put(put(source, "still_2.jpg"), content=b"p").status_code, 409)
    (tmp / JOB / "input" / "still_2.jpg.part").unlink()
    pieces(api, tmp, source)
    photos_only = "7e1f2a3b-4c5d-4e6f-8a9b-0c1d2e3f4a5b"
    api.put(put(f"/jobs/{photos_only}/source", "still_1.jpg"), content=b"p")
    check("start with photos but no video", api.post(f"/jobs/{photos_only}/start", headers=BEARER, json={"plate_cm": 27}).status_code, 409)


def pieces(api: TestClient, tmp: Path, source: str) -> None:
    """A photo in three pieces, out of order, one sent twice: whole once the last arrives."""
    url = put(source, "still_3.jpg")
    inputs = tmp / JOB / "input"
    for n, body in [(2, b"cc"), (0, b"aa")]:
        r = api.put(f"{url}&part={n}&parts=3", content=body)
        check(f"piece {n} of 3", (r.status_code, r.json()["whole"]), (200, False))
    check("start while pieces are missing", api.post(f"/jobs/{JOB}/start", headers=BEARER, json={"plate_cm": 27}).status_code, 409)
    check("a piece sent again replaces the first", api.put(f"{url}&part=0&parts=3", content=b"AA").status_code, 200)
    r = api.put(f"{url}&part=1&parts=3", content=b"bb")
    check("the last piece makes the file whole", (r.json()["whole"], (inputs / "still_3.jpg").read_bytes()), (True, b"AAbbcc"))
    check("no pieces are left behind", list((inputs / ".parts").rglob("*")), [])
    check("a whole file takes no more pieces", api.put(f"{url}&part=0&parts=3", content=b"x").status_code, 409)
    for query, label in [("&part=3&parts=3", "past the last"), ("&part=-1&parts=3", "negative"), ("&part=a&parts=3", "not a number"),
                         ("&part=0", "without the count"), ("&part=0&parts=5000", "too many")]:
        check(f"a piece numbered {label}", api.put(f"{put(source, 'still_4.jpg')}{query}", content=b"x").status_code, 400)


def starting(api: TestClient, tmp: Path, backend: FakeBackend, source: str) -> None:
    start = f"/jobs/{JOB}/start"
    check("start needs the secret", api.post(start, json={"plate_cm": 27}).status_code, 401)
    for body, label in [({"plate_cm": -27}, "a negative plate"), ({"plate_cm": 27, "base_logo": "/etc/hosts"}, "a logo that is a path"),
                        ({"plate_cm": 27, "base_logo": "https://evil.example/x.png"}, "a logo on another host"),
                        ({"plate_cm": 27, "base_color": "zzzzzz"}, "a colour that is not hex"), ({}, "no plate"),
                        ({"plate_cm": 27, "mode": "spin"}, "a filming mode it does not know")]:
        check(f"start refuses {label}", api.post(start, headers=BEARER, json=body).status_code, 422)
    check("start refuses a body that is not JSON", api.post(start, headers=BEARER, content=b"[[").status_code, 422)
    r = api.post(start, headers=BEARER, json={"plate_cm": 24, "mode": "turntable", "base_text": "Chez Foodify", "base_logo": LOGO, "frames": 9999, "debug": True})
    check("start", (r.status_code, backend.started), (202, [JOB]))
    params = json.loads((tmp / JOB / "params.json").read_text())
    check("only valid parameters Foodify may set are kept", params, {"plate_cm": 24.0, "mode": "turntable", "base_text": "Chez Foodify", "base_logo": LOGO})
    check("start twice", api.post(start, headers=BEARER, json={"plate_cm": 27}).status_code, 409)
    check("a photo after the start", api.put(put(source, "still_2.jpg"), content=b"p").status_code, 409)


def results(api: TestClient) -> None:
    body = api.get(f"/jobs/{JOB}", headers=BEARER).json()
    check("status when done", (body["state"], body["report"]["status"]), ("done", "ok"))
    glb = f"/jobs/{JOB}/files/dish.glb"
    check("file needs the secret or a signature", api.get(glb).status_code, 401)
    r = api.get(get(glb))
    check("file by signed URL", (r.status_code, r.content, r.headers["content-type"]), (200, b"glTF-fake", "model/gltf-binary"))
    check("file with the server's secret", api.get(glb, headers=BEARER).status_code, 200)
    check("a signature is for one file only", api.get(get(glb).replace("dish.glb", "base.jpg", 1)).status_code, 401)
    check("the report is not served as a file", api.get(f"/jobs/{JOB}/files/report.json", headers=BEARER).status_code, 404)
    check("a file not produced yet", api.get(f"/jobs/{JOB}/files/dish.usdz", headers=BEARER).status_code, 404)


def lifecycle(api: TestClient, tmp: Path) -> None:
    running, queued, stalled, old = (f"{c * 8}-1111-4111-8111-{c * 12}" for c in "abcd")
    for job, state in [(running, "running"), (queued, "queued"), (stalled, "running"), (old, "done")]:
        (tmp / job).mkdir()
        write_status(tmp / job, state, "dense" if state == "running" else None)
    status = read_json(tmp / stalled / "status.json")
    (tmp / stalled / "status.json").write_text(json.dumps({**status, "updated": status["updated"] - 11 * 60}))
    body = api.get(f"/jobs/{stalled}", headers=BEARER).json()
    check("a running job whose heartbeat stopped reads as failed", (body["state"], body["report"]["error"]), ("failed", STALLED))
    check("a running job with a heartbeat is still running", api.get(f"/jobs/{running}", headers=BEARER).json()["state"], "running")
    check("a restart fails the running jobs and gives back the queued ones", recover(tmp), [queued])
    check("an interrupted job says why", api.get(f"/jobs/{running}", headers=BEARER).json()["report"]["error"], INTERRUPTED)
    check("finished jobs older than the limit are deleted, and only those", prune(tmp, 14, now=time.time() + 15 * 86400) != [], True)
    check("the job folder is gone", (tmp / old).exists(), False)


def cors(api: TestClient, source: str) -> None:
    r = api.options(source, headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "PUT"})
    check("CORS lets Foodify's page upload", r.headers.get("access-control-allow-origin"), "http://localhost:3000")
    r = api.options(source, headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "PUT"})
    check("CORS refuses another site", r.headers.get("access-control-allow-origin"), None)


def main() -> None:
    os.environ["CAPTURE_ENGINE_SECRET"] = SECRET
    with tempfile.TemporaryDirectory() as tmp_name:
        tmp = Path(tmp_name)
        backend = FakeBackend(tmp)
        api = TestClient(create_app(backend))
        source = f"/jobs/{JOB}/source"
        check("health", api.get("/health").status_code, 200)
        check("status before upload", api.get(f"/jobs/{JOB}", headers=BEARER).json()["state"], "waiting")
        check("status needs the secret", api.get(f"/jobs/{JOB}").status_code, 401)
        signatures(api, source)
        uploads(api, tmp, source)
        starting(api, tmp, backend, source)
        results(api)
        lifecycle(api, tmp)
        cors(api, source)
    print("\nservice test passed")


if __name__ == "__main__":
    main()
