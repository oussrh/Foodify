---
title: "Standards progress"
description: "The scoreboard of the engineering standard on this repository: what each metric measures, the ratchet that holds it, the phases open, and the dated log of every deliberate change of a floor. Numbers only, never 'improved'."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["standards", "ratchet", "scoreboard"]
related: ["./README.md", "./ADOPTION_DECISIONS.md"]
---

# Standards progress

## Scoreboard

| Metric | Day 0 | Now | Target | Held by | Rule |
|---|---|---|---|---|---|
| Gap-analysis score | 49/100 | 53/100 | 100 | `abatty measure` | - |
| Enforced share (rules held by a machine) | 74% (35/47) | 76% (34/45) | 100% | `abatty measure` | - |
| `size.overBudget` (files over their kind's budget) | 31 | 34 | 0 | ratchet | CODE.1 |
| `size.excessCode` (code lines over budget, summed) | 5302 | 5307 | 0 | ratchet | CODE.1 |
| `size.overRaw` (files over the 800-line cap) | 1 | 1 | 0 | ratchet | CODE.1 |
| `types.escapes` (`any`, `ts-ignore`) | 13 | 13 | 0 | ratchet | TYPES.1 |
| `valid.rawEnv` (`process.env` outside `lib/env.ts`) | 37 | 37 | 0 | ratchet | VALID.3 |
| `docs.frontMatter` (documents without front matter) | 2 | 0 | 0 | hard | DOC.1 |
| `docs.indexDrift` (documents missing from the index) | 1 | 0 | 0 | hard | DOC.3 |

## Phase status

| # | Phase | Status |
|---|---|---|
| 0 | The instrument: ratchet, gate + hook, CI step, control cases | in progress: awaiting the first CI run (see log, 2026-09-20) |
| 1 | Lint to zero warnings | pending |
| 2 | Coverage pinned | pending |
| 3-13 | see `ADOPTION_STATE.json` | pending |

## Log

- 2026-09-20 · **phase 0, instrument in place, awaiting its first CI run** · CI: `.github/workflows/checks.yml` runs `pnpm run gate` (the pre-push hook's script: lint, typecheck, import graph, dead code, unit tests, ratchet + changelog over the pushed range, secret scan, production build) and `pnpm audit --prod --audit-level=high`; `pnpm install --frozen-lockfile`; `PRISMA_GENERATE_SKIP_AUTOINSTALL`. Rules: INST-CI missing → present, INST-CI-STEPS missing → present, SEC-LOCKFILE partial → present, SEC-SECRETS partial → present. Score 55 → 53 (the merged tree's larger surface: PWA-CONTRACT now applies, FLOW-EMDASH 9 → 12 files; not this phase's files), enforced share 74% → 76%. **Switch proven**: `pnpm run -s standards -- --range main..HEAD` (the command CI runs) exit 3 with `types.escapes` floor lowered 13 → 12 in the baseline, exit 0 restored. `abatty doctor --controls`: 5 steps red on a planted violation; the three `.githooks/*` files were mode 100644 (only executable on Windows), now 100755. **Left**: no workflow run exists yet (the branch is unpushed; the agent may not push), so the CI-level red/green and its run URLs are still to be logged here; the CI audit step is red on day one (7 critical, 33 high in production deps: `next` 15.4.4 → ≥ 15.5.24, `next-auth` beta.29 → ≥ beta.32, `@auth/core` → ≥ 0.41.3, `tailwindcss-animate`'s glob/minimatch chain) — the upgrade is its own change; no format step until a `.prettierrc` exists; the first CI run is on the push. INST-DEAD-CI reads partial because the `synovitec` profile assumes Woodpecker; this repository's CI is GitHub Actions (upstream report).

- 2026-09-20 · `size.overBudget` 31 → 34, `size.excessCode` 5302 → 5307 · owner: Oussama Rhoni. Reason: the harness merged into `main`, whose branding, contact and PWA work (four files: `components/menu/restaurant-page.tsx`, `app/restaurant/[slug]/page.tsx`, `components/branding/branding-panel.tsx`, `components/contact/contact-panel.tsx`) the day-0 floor was never measured on; the floor is re-measured on the tree it now guards. Same commit: `valid.rawEnv` held at 37 (`lib/env.ts` created), `docs.indexDrift` 1 → 0 and promoted to hard.
