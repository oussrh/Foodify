---
title: "Testing"
description: "What the unit suite covers, the coverage floor per area and why each exclusion exists (TEST.4: an unwritten exclusion is indistinguishable from a hole); the suites still to come."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["testing", "coverage", "vitest"]
related: ["./README.md", "./STANDARDS_PROGRESS.md"]
source_truth: ["vitest.config.ts", "vitest.integration.config.ts", "package.json"]
last_verified: "2026-09-23"
---

# Testing

`pnpm test` runs Vitest with coverage (`vitest run --coverage`); `pnpm test:watch` for a file at a
time. The gate and CI run `pnpm test`, so a coverage drop below the floor is red for the push.
`pnpm test:changed` (CI runs it after the gate) holds the same floor over the `lib/` files the
push changed, measured against `origin/main`: an untested new file, or an edit to a file below
the floor, is red even while the total holds (TEST.4, the changed-lines gate).

## Unit suite

Colocated `*.test.ts` beside the module (TEST.1); Vitest's default discovery collects any `*.test.ts(x)` in the tree, so a test dropped beside a component is run, not silently skipped. `.claude/**` is excluded from discovery: it can hold a git worktree of this repository, whose copy of the suite would otherwise run a second time against another branch's code. Fixtures are builders in `test/factories/`,
never inline blobs. Time is `vi.useFakeTimers()` + `vi.setSystemTime()` restored in `afterEach`;
no test touches the network (`fetch` is stubbed where a module calls it).

## Coverage floor

Two areas: `lib/`, the shared layer (the customer-menu data formats, brand colour, pricing, locale,
TOTP, JSON-LD, the schemas, the list keyset), and `server/`, the process's modules (the logger's
redaction and level rule, the SIGTERM drain). The floor is pinned in
`vitest.config.ts` at the figure measured on 2026-09-22 (first set on 2026-09-20, raised on 2026-09-21 and twice on 2026-09-22) and only ever raised; branches and
functions are what bind (TEST.4). `thresholds.autoUpdate` is never set: a raise is a reviewed
change with the new number in the log of `STANDARDS_PROGRESS.md`.

| Area | Statements | Branches | Functions | Lines | Set on |
|---|---|---|---|---|---|
| `lib/**` | 98.9 | 94.5 | 99.1 | 99.3 | 2026-09-22, after covering `lib/roles.ts`, `lib/order-data.ts` and `lib/schemas/staff.ts`, which shipped untested and were caught by the changed-lines gate (from 97.5 / 93.5 / 97.5 / 97.7 earlier the same day with the insights arithmetic; 96.7 / 91.7 / 94.0 / 96.9 on 2026-09-21, phase 10; 93.0 / 81.3 / 79.4 / 93.3 on 2026-09-20). `lib/insights-loader.ts` is excluded like the other loaders: it is grouped SQL, held by `tests/integration/insights.test.ts` |
| `lib/menu.ts` (money display, per file) | 88.8 | 85 | 63.6 | 86.2 | 2026-09-20 |
| `lib/totp.ts` (2FA check, per file) | 100 | 100 | 100 | 100 | 2026-09-20 |
| `server/**` (the logger's redaction, the drain) | 100 | 100 | 100 | 100 | 2026-09-21, phase 13 |

`app/` and `components/` have no unit floor: server actions and route handlers need a session and
Postgres (the phase-10 integration suite, TEST.2), and the components are presentational (the
Playwright + axe suite, TEST.3); `app/api/health/route.test.ts` is the one route unit test (the
client and the drain mocked; `e2e/health.spec.ts` asks the real one on the production build). Both are listed as missing in `GAP_ANALYSIS_2026-09-20.md`.

## Exclusions

Each one is in `vitest.config.ts` → `coverage.exclude` with the same reason:

| Path | Why it is not unit-tested |
|---|---|
| `lib/prisma.ts` | The Prisma client singleton; no logic of its own |
| `lib/cloudinary.ts` | A wrapper over the Cloudinary SDK and the network; an integration concern |
| `lib/auth-guard.ts` | Needs a NextAuth session and Postgres; belongs to the integration suite |
| `lib/restaurant-loader.ts` | The same guard over the same database; held by `tests/integration/order-board.test.ts` |
| `lib/insights-loader.ts` | Grouped SQL over the same database; held by `tests/integration/insights.test.ts` |
| `lib/emails/**` | HTML templates; presentational |

## Contrast of the tokens

`pnpm contrast` runs `test/contrast.test.ts` alone: every text-on-surface pair of the design tokens in
`app/globals.css` at 4.5:1 and the focus ring at 3:1, in both themes; it is part of `pnpm test` too.

## Browser suite

`pnpm e2e` runs Playwright (`playwright.config.ts`, specs in `e2e/`) against the production build
served on port 3100 (`pnpm build` first; the gate and CI do both), each journey with an axe scan
that fails on any serious or critical violation (TEST.3, A11Y.1):

| Spec | Journey |
|---|---|
| `menu.spec.ts`, `ar-viewer.spec.ts` | The guest's menu: load, language, dish sheet, 3D view, category bar |
| `ordering.spec.ts` | A guest's order from a row to "sent", with the table from the QR link |
| `order-life.spec.ts` | That order across the devices: started and called up on the kitchen board, carried out from the waiter's phone, every stamp on the row; and a tablet kept out of the portals |
| `waiter-order.spec.ts` | A waiter taking an order at a table: search, notes on the dish and the order, sent and listed |
| `sold-out.spec.ts` | A dish marked sold out on the tablet: shown but not orderable, refused by the endpoint (409), then back |
| `sign-in.spec.ts`, `hours.spec.ts` | The sign-in pages and the opening-hours editor |
| `audit.spec.ts` | Every page of the guest, manager, admin and device screens at rest, under axe |

Signed-in journeys sign in for real: `e2e/session.ts` makes an account for the test and writes
the emailed code it would have received; `e2e/staff.ts` makes device accounts (username and
password, no second factor) and a dish of the test's own. The phone and desktop projects run in
parallel on one database, so a test never assumes the state of a shared row: it makes its own
(a dish, a table, an account), sets in the form what it reads (`hours.spec.ts` closes the days it
checks), and removes what it made. Two projects, a phone and a desktop; retries 0 locally and
2 in CI; a trace on the first retry. Test data is the seeded restaurant (`prisma/seed.ts`); CI seeds
a Postgres service before the run. Vitest excludes `e2e/`.

## Integration suite

`pnpm test:integration` runs `tests/integration/**` (`vitest.integration.config.ts`) against a real
Postgres on the real migrations (TEST.2, DATA.3): `scripts/ci/integration.mjs` takes
`TEST_DATABASE_URL` when set (CI's service) or starts a throwaway `postgres:16-alpine` container
on port 5499 (left running for the next run), applies `prisma migrate deploy`, then runs the
suite. `DATABASE_URL` is never read, so the suite cannot touch the database a developer's `.env`
names. Every test runs inside a transaction that is rolled back (`tests/integration/db.ts`); the
code under test reaches that transaction through the `@/lib/prisma` mock in `setup.ts` and the
session it is signed in as through `session.ts`, so the guards, the actions and the queries run
unchanged on real rows and constraints, and nothing is mocked but the session and the cache
revalidation. No coverage here: the unit floors hold the shared layer; this suite holds what a
unit test cannot see: tenant isolation through the guards and the actions (`tenant-isolation.test.ts`,
the negative proof DATA.3 asks for), the money column, a keyset page over real rows, the sort
order a write leaves behind. The gate's database suite runs it when a push touches `prisma/` or
`tests/integration/`; CI runs it on every push after the gate.

## Still to come

- The manager's writes in the browser: a dish created and edited (uploads, dietary options),
  categories, settings saved, branding, tables, the People tab. The sweep opens every one of
  these pages; none is driven.
- The account flows: the second factor turned on and off, a password changed, an email changed.
- The installed apps: the service workers, a new version waiting for Refresh, the menu offline.
