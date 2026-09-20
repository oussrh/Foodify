---
name: patterns-probe-refactor
description: How to prove a refactor of the repository's own abatty probes (abatty-probes/*.mjs) kept every reading - a differential script over the whole tree plus the controls, on top of `abatty ratchet --controls`
metadata:
  type: project
---

`abatty-probes/` is outside `sourceGlobs` (lint-only, no size budget) but every probe there is
a text scanner other probes share (`text.mjs`: `closeOf`, `paramNames`, `functionAt`). The
controls (`pnpm exec abatty ratchet --controls`) prove the ratchet numbers, not the helpers.
The proof that held: import the HEAD copy and the new module side by side in a scratch `.mjs`,
run `closeOf` on every `(` and `{` of every source file for both pairs, `functionAt` on every
exported function, `paramNames` on a corpus of tricky lists (`{ a: { b } }, c`, `a = 'x,y'`,
generics), and `scan` of the probe on the real tree and on its own controls; compare JSON.
18,630 checks over 312 files on 2026-09-20, identical.

**Why:** The scanners carry quirks worth keeping identical (a `//` with no newline returns -1
through `indexOf`; `AUTHORIZE` is a `/g` regex whose `lastIndex` must be reset after `.test`
before `matchAll`); a rewrite "that reads better" can change a count silently.

**How to apply:** Any edit under `abatty-probes/`. Known latent issue left as is: `closeOf`
loops forever on an unterminated `/*` (indexOf -1 + 1 = 0 restarts the scan); never triggers on
parseable source.
