---
name: patterns-shared-scratchpad
description: The session scratchpad is shared by every parallel agent of the phase; namespace scratch files by territory and never clean a shared folder
metadata:
  type: feedback
---

Namespace scratch work under `<scratchpad>/<territory>/` (e.g. `t2/`) and only ever delete inside it.

**Why:** on 2026-09-20 (phase 7, T2) `<scratchpad>/before/components/` already held another agent's
HEAD copies when I wrote mine there; a `rm -rf` of "my" folder would have destroyed their proof.
**How to apply:** first command of a run: `mkdir -p <scratchpad>/<territory>`; put the eslint
override config, the HEAD copies (`git show HEAD:<path>`), the render harness and its `out/` there.
