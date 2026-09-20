---
title: "Testing"
description: "What the unit suite covers, the coverage floor per area and why each exclusion exists (TEST.4: an unwritten exclusion is indistinguishable from a hole); the suites still to come."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["testing", "coverage", "vitest"]
related: ["./README.md", "./STANDARDS_PROGRESS.md"]
source_truth: ["vitest.config.ts", "package.json"]
last_verified: "2026-09-20"
---

# Testing

`pnpm test` runs Vitest with coverage (`vitest run --coverage`); `pnpm test:watch` for a file at a
time. The gate and CI run `pnpm test`, so a coverage drop below the floor is red for the push.
`pnpm test:changed` (CI runs it after the gate) holds the same floor over the `lib/` files the
push changed, measured against `origin/main`: an untested new file, or an edit to a file below
the floor, is red even while the total holds (TEST.4, the changed-lines gate).

## Unit suite

Colocated `*.test.ts` beside the module (TEST.1). Fixtures are builders in `test/factories/`,
never inline blobs. Time is `vi.useFakeTimers()` + `vi.setSystemTime()` restored in `afterEach`;
no test touches the network (`fetch` is stubbed where a module calls it).

## Coverage floor

One area today, `lib/`, the shared layer (the only code with a unit surface: the customer-menu
data formats, brand colour, pricing, locale, TOTP, JSON-LD). The floor is pinned in
`vitest.config.ts` at the figure measured on 2026-09-20 and only ever raised; branches and
functions are what bind (TEST.4). `thresholds.autoUpdate` is never set: a raise is a reviewed
change with the new number in the log of `STANDARDS_PROGRESS.md`.

| Area | Statements | Branches | Functions | Lines | Set on |
|---|---|---|---|---|---|
| `lib/**` | 92.4 | 79.7 | 79.4 | 92.5 | 2026-09-20 |

`app/` and `components/` have no unit floor: server actions and route handlers need a session and
Postgres (the phase-10 integration suite, TEST.2), and the components are presentational (the
Playwright + axe suite, TEST.3). Both are listed as missing in `GAP_ANALYSIS_2026-09-20.md`.

## Exclusions

Each one is in `vitest.config.ts` → `coverage.exclude` with the same reason:

| Path | Why it is not unit-tested |
|---|---|
| `lib/prisma.ts` | The Prisma client singleton; no logic of its own |
| `lib/cloudinary.ts` | A wrapper over the Cloudinary SDK and the network; an integration concern |
| `lib/auth-guard.ts` | Needs a NextAuth session and Postgres; belongs to the integration suite |
| `lib/emails/**` | HTML templates; presentational |

## Still to come

- Integration (TEST.2): real Postgres in a rolled-back transaction, on real migrations — phase 10.
- End-to-end (TEST.3): Playwright with `axe`, a mobile viewport as a project — the browser job in
  `.github/workflows/checks.yml` is added when the `e2e` script exists.
