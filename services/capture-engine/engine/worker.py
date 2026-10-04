"""One job in its own process: `python -m engine.worker <jobs root> <job id>`.

The heavy steps (Open3D, xatlas, OpenUSD) hold Python's GIL for tens of seconds and a native crash
kills its process; run in the API's process, they froze uploads and status calls and could take
the whole queue down. Here they cost one job at most.
"""

import sys
from pathlib import Path

from .jobs import run_job

if __name__ == "__main__":
    run_job(Path(sys.argv[1]), sys.argv[2])
