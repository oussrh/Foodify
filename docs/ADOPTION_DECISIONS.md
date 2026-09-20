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
- **Default taken**: `ratchet.ratchet: ["size.overRaw"]`: the metric is held at 1 and may only fall.
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
- **Closed 2026-09-20**: red run 35510629826 (floor lowered on a throwaway branch), green run 35509687312 on `main`; phase 0 done.

## 2026-09-20 · phase 2 · two dev dependencies installed by day

- **Situation**: phase 2 pins coverage, and the repository had no test runner. The night protocol forbids installing a dependency; this was an attended run.
- **Default taken**: `vitest` 5.0.1 and `@vitest/coverage-v8` 5.0.1 added as devDependencies in the phase commit, lockfile updated, `PRISMA_GENERATE_SKIP_AUTOINSTALL=true` set for the install.
- **Alternative set aside**: waiting for a morning to install. The phase cannot start without a runner, and the user asked for the phase.
- **Re-read when**: never; recorded so a night reading the range knows the install was a decision, not a drift.

## 2026-09-20 · dependency upgrade · Next 16 lint presets at warn, ESLint held at 9

- **Situation**: `eslint-config-next` 16 brings typescript-eslint and the React Compiler rules of `eslint-plugin-react-hooks` 7; on this tree they report 36 errors and 104 warnings that Next 15's `core-web-vitals` never checked (95 unused imports, 12 `any` the ratchet already counts, 20 compiler findings such as `setState` inside an effect). ESLint 10 cannot be used: the `react`, `jsx-a11y` and `import` plugins the preset depends on have no release that supports it.
- **Default taken**: the presets are on in full; the five rules with new errors run at `warn` in `eslint.config.mjs` with the counts in the comment; three empty interfaces and one `@ts-ignore` fixed in the same commit; ESLint 9.39.5 (the `maintenance` tag) until the plugins move.
- **Alternative set aside**: fixing the 32 semantic findings inside the upgrade. They are component work (several in `components/ar-viewer-client.tsx`, the file due for a split) with no browser suite to catch a behaviour change; that is phase 1 (lint to zero, then `--max-warnings=0`) and phase 9 (types).
- **Re-read when**: phase 1 starts, and when `eslint-plugin-react` publishes ESLint 10 support.

## 2026-09-20 · dependency upgrade · what "latest" was held back on, and why

- **Situation**: after Next 16, Prisma 7, Tailwind 4, otplib 13, resend 6 and lucide 1.x, `pnpm outdated` still lists TypeScript 7.0.2, ESLint 10.11, Prisma 8.0.0-rc.15 and `@types/node` 26.
- **Default taken**: TypeScript stays 5.9.3 (`typescript-eslint` peers `<6.1.0`; knip and dependency-cruiser use the same API); ESLint 9.39.5 (`eslint-plugin-react`, `jsx-a11y`, `import` have no ESLint 10 release); Prisma 7.10 (8 is a release candidate); `@types/node` 24 (CI and Vercel run Node 22/24; types track the runtime, not the newest Node). `abatty` pinned to 6fc516c (upstream HEAD spawns `.cmd` without a shell, EINVAL on Node >= 20.12).
- **Alternative set aside**: forcing them with overrides or `--force`. A type-checker, a linter and a query-engine RC are not places to run ahead of the tools that consume them.
- **Re-read when**: `typescript-eslint` accepts TypeScript 6/7, `eslint-plugin-react` publishes ESLint 10 support, Prisma 8 ships, abatty fixes its Windows spawn.

## 2026-09-20 · phase 3 · the input border reads 1.46:1 on the light ground

- **Situation**: `test/contrast.test.ts` computes contrast from the tokens. Every text pair passes AA in both themes once `--warning` (light) is darkened two points (it read 4.11:1 on `--muted`, where badges paint it); the focus ring passes 3:1; `--input` on `--background` reads below the 3:1 WCAG 1.4.11 asks for a control's boundary (the test prints the figures).
- **Default taken**: the input pair is pinned at what it measures in each theme so it cannot fall further; the target is written beside it.
- **Alternative set aside**: darkening `--input` in this phase. It is a token of the Quiet Plate design system (hairline fields on a paper ground, with a 3:1 focus ring and a white field surface); the change is a design decision to take with the branding preview open, not a lint fix.
- **Re-read when**: the token moves; raise the floor to 3 in the same change.

## 2026-09-20 · phase 3 · `aria-role` ignores non-DOM components; the prop rename is deferred

- **Situation**: `role="admin" | "manager"` is this app's portal prop on five of its own components (`SignInFlow`, `AppShell`, `RestaurantRowMenu`, `DishesList`, `RestaurantsList`) with twelve call sites; `jsx-a11y/aria-role` reads it as an invalid ARIA role.
- **Default taken**: the rule's `ignoreNonDOM: true`, with the shadcn primitives that render DOM (Badge, the Card and Table parts, Button, Input, Textarea, Label, Link, Image) mapped so a `role` on them is still checked. The reviewer showed `<Badge role="stauts">` passed before the mapping; it fails after.
- **Alternative set aside**: renaming the prop to `portal`. Seventeen files change; that is a codemod (CODE.11) and belongs with the shell work of phase 8, not inside the lint phase.
- **Re-read when**: phase 8 touches the shells; rename then and drop the option.
