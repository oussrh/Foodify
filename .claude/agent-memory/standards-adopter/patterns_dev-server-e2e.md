---
name: patterns-dev-server-e2e
description: When pnpm build is off limits, run the Playwright specs against the project's own running `next dev` (port 3000, serves the tree from .next/dev) through a scratch config that spreads the repo config and drops webServer
metadata:
  type: project
---

Playwright here is wired to `pnpm start --port 3100` over a production build. In a run where
`pnpm build` is forbidden, `.next/BUILD_ID` is HEAD's build and `pnpm start` would test the
wrong code. Next 16's `next dev` writes to `.next/dev` and recompiles a page 0.1 s after its
edit, so the dev server already on port 3000 (check it is THIS project's: parent process
command line ends in `next dev`) serves the working tree. A scratch config in the scratchpad
`import base from '<repo>/playwright.config'`, `defineConfig({ ...base, testDir: '<repo>/e2e',
outputDir: '<scratch>/test-results', use: { ...base.use, baseURL: 'http://localhost:3000' },
webServer: undefined })`, then `pnpm exec playwright test menu.spec.ts --config <that file>`
(the file arg is a filter, so a bare name works). Prove the tree was served: the compiled
`.next/dev/server/app/<route>/page.js` is newer than the edit and its SSR chunk names the new
module (`grep -rl lib/<new-module> .next/dev/server`).

**Why:** phase 8 (2026-09-20) had 8 browser tests to keep green on the menu route with no build
allowed; the axe scans passed on both projects this way in 7 s.
**How to apply:** any territory that touches a route with e2e coverage during a no-build run.
Never start a second `next dev` of the same project (they would share `.next/dev`).
