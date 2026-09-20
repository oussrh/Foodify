---
title: "Adoption decisions"
description: "The decisions taken alone by the unattended adoption nights (/adopt-standards): date, phase, situation, the default taken, the alternative set aside, what the morning must re-read."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["standards", "adoption", "decisions"]
related: ["./README.md", "./STANDARDS_PROGRESS.md"]
---

# Adoption decisions

## 2026-09-20 · day 0 · `size.overRaw` held as a ratchet

- **Situation**: `components/ar-viewer-client.tsx` is 810 code lines, over the 800-line absolute cap, so the baseline could not be written.
- **Default taken**: `ratchet.ratchet: ["size.overRaw"]` — the metric is held at 1 and may only fall.
- **Alternative set aside**: splitting the AR viewer (support detection, model-viewer loading, controls, AR launch) in the adoption commit. It is the customer-facing AR surface, mid-redesign on `redesign/quiet-plate`; the split belongs with that work, not with the instrument.
- **Re-read when**: the redesign branch merges. The split drops the metric to 0 and this entry is closed by removing the override.

## 2026-09-20 · merge into `main` · size floors re-measured

- **Situation**: the harness was baselined on `security/guard-actions-and-routes`, a tree without the branding, contact and PWA work already on `main`. On merge the ratchet reported `size.overBudget` 31 → 34 and `size.excessCode` 5302 → 5307: `components/menu/restaurant-page.tsx` (603 code lines, budget 250), `app/restaurant/[slug]/page.tsx` (134 / 100), `components/branding/branding-panel.tsx` (287 / 250), `components/contact/contact-panel.tsx` (253 / 250).
- **Default taken**: `abatty baseline --reason --owner` on the merged tree; the two size floors now hold `main`'s true day-0 numbers. The other regressions were fixed, not re-baselined: `lib/env.ts` absorbs the five new `process.env` reads, `docs/README.md` lists every document.
- **Alternative set aside**: splitting the four files in the merge commit. The restaurant page is the customer-facing menu, just rebuilt with the PWA flow and without tests; its split (header, sections, PWA banners, footer are the seams) is a reviewed change of its own.
- **Re-read when**: the restaurant page is split. That drops `size.excessCode` by 353 and `size.overBudget` by 1; the three marginal files follow, and this entry is closed.


## 2026-09-20 · phase 0 · the CI audit step is blocking, and red on day one

- **Situation**: `pnpm audit --prod --audit-level=high` reports 7 critical and 33 high advisories in production dependencies, all fixed upstream (`next` 15.4.4 → ≥ 15.5.24 for two unauthenticated RCEs; `next-auth` beta.29 → ≥ beta.32 and `@auth/core` → ≥ 0.41.3 for an auth-check bypass; `tailwindcss-animate`'s glob/minimatch/brace-expansion chain). The gate's own audit step is skipped under pnpm (it wants `package-lock.json`), so the repository had never been audited.
- **Default taken**: the CI step is blocking (SEC-AUDIT, FLOW.3: never a non-blocking step to go green). The first CI run is red until the dependencies move.
- **Alternative set aside**: upgrading `next` and `next-auth` inside phase 0. A framework minor and an auth-library beta bump change runtime behaviour (sign-in, middleware) in a repository with no end-to-end suite; that is its own reviewed change with a manual sign-in check, done by day.
- **Reviewer (must, SEC-AUDIT)**: fix the dependencies or record dated allowances. Response: `pnpm audit` reads no allowance file, so an allowance would be a non-blocking step by another name; the upgrade is the fix and is the next change by day (origin carries `vercel/react-server-components-cve-vu-a9ohli`, Vercel's own bump for the flight-protocol RCE, to read first).
- **Re-read when**: the upgrade lands; the step goes green by itself and this entry is closed.

## 2026-09-20 · phase 0 · `abatty ci` output adapted, not taken as is

- **Situation**: the generated `checks.yml` assumes npm (`npm ci` fails: no `package-lock.json`), a `.prettierrc`, and `test`, `test:integration`, `coverage`, `e2e` scripts that do not exist: every job would be red for a reason unrelated to the code (INST-DEAD-CI).
- **Default taken**: one job with the steps the repository can run today, each calling the same package.json script the pre-push gate calls; pnpm with `--frozen-lockfile`; `PRISMA_GENERATE_SKIP_AUTOINSTALL=true` after `prisma generate` rewrote `package.json` and emptied 24 packages in the pnpm store during a dummy-env build on this machine. The database and browser jobs return with their scripts (phases 10 and TEST.3). `abatty ci --check` compares against the npm template and will keep saying "behind"; the reason is in the file's header.
- **Alternative set aside**: waiving INST-DEAD-CI's partial reading (the `synovitec` profile treats a GitHub workflow as dead beside Woodpecker; this repository's CI is GitHub Actions). A waiver is the morning's to write in `rules.waived`; it is reported upstream instead.
- **Reviewer (should)**: explicit steps drift from the hook's list and the measure's `/test/i` matched `ubuntu-latest`, not a test step. Taken: CI now runs `pnpm run gate` itself, one step, plus the audit the gate cannot run under pnpm; `.github/` added to `changelogRequiredFor` (CHANGE.1 names CI); `main` exempt from `cancel-in-progress` so every commit on it gets a verdict. Dropped from the template and why: the bypass-rate step (abatty's `report` reads `c.changelog` where the config keeps `files.changelog`, so every changelog-carrying commit reads as bypassed and the step exits 1; upstream report), SARIF upload and attestation (need code-scanning and attestation entitlements this repository has not decided on), scrub (`scrub.enabled` is off).
- **Re-read when**: abatty's `ci` generator learns pnpm and the repository's script set, or a `.prettierrc` lands (the gate picks the format step up by itself).

## 2026-09-20 · phase 0 · closed only when CI has run

- **Situation**: the exit criterion is the CI step going red on a lowered floor and green when restored. The command is proven both ways on this machine (`pnpm run -s standards -- --range main..HEAD`: exit 3 with `types.escapes` 13 → 12, exit 0 restored) and CI runs the same script, but no workflow run exists: the branch is unpushed and the agent may not push (`directPushToBase: false`; the user pushes).
- **Default taken**: the phase stays `in_progress` in `ADOPTION_STATE.json` with its numbers recorded. It closes when the first run's URL is in the progress log and the ratchet step has been seen red then green there; the audit step is red until the dependency upgrade, so the first green run follows that change.
- **Alternative set aside**: marking it done on the local proof. A switch nobody watched fail in the place it guards is not flipped (§B.1.3).
- **Re-read when**: the push lands and the run is read.
