---
title: "Adoption decisions"
description: "The decisions taken alone by the unattended adoption nights (/adopt-standards): date, phase, situation, the default taken, the alternative set aside, what the morning must re-read."
category: governance
status: living
audience: ["developer", "agent"]
tags: ["standards", "adoption", "decisions"]
related: ["./README.md", "./STANDARDS_PROGRESS.md"]
source_truth: ["abatty.config.json", "docs/ADOPTION_STATE.json", "eslint.config.mjs"]
last_verified: "2026-09-21"
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
- **Re-read when**: the restaurant page is split. That drops `size.excessCode` by 353 and `size.overBudget` by 1; the three marginal files follow, and this entry is closed. **Closed 2026-09-20 (phase 7, d773304)**: the page is 124 code lines over eight files, the branding and contact panels are under budget; `app/restaurant/[slug]/page.tsx` is one of the eight pages phase 8 finishes.


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
- **Re-read when**: phase 8 touches the shells; rename then and drop the option. **Closed 2026-09-21 (phase 9, the rename codemod)**: the prop is `portal` on the eight declaring components and twelve call sites; `ignoreNonDOM` is gone.

## 2026-09-20 · phase 4 · the shared schemas carry English sentences, not message keys

- **Situation**: VALID.2 wants a shared schema to carry message keys so each side translates. The dashboards have one language and no message catalogue; the public menu's strings live in `lib/menu.ts` and no form there submits.
- **Default taken**: the schemas in `lib/schemas/` carry the sentences the forms showed, once each (a rule that two forms worded differently now says one thing).
- **Alternative set aside**: inventing a key catalogue for one language. It is the i18n work of the admin UI, not a validation fix.
- **Re-read when**: an i18n layer reaches the dashboards; the sentences become keys in the same change.

## 2026-09-20 · phase 4 · guard first, then parse

- **Situation**: `docs/LESSONS.md` fixed the first statement of every server action as a guard after two months of unguarded endpoints; VALID.1 asks for a parse at the edge.
- **Default taken**: the guard stays first and the parse is the next statement. Nothing runs between them, and a malformed id reaches the guard as the same "not found" it always was.
- **Alternative set aside**: parsing before the guard, which would put a shape check in front of the one rule the lesson made unconditional.
- **Re-read when**: a guard needs a parsed value it cannot get from the raw one.

## 2026-09-20 · phase 4 · two password rules, on purpose

- **Situation**: an admin sets a client's or admin's password at creation and on a reset (six characters, `FORCE_CHANGE` on the reset); a user changes their own on the profile page (eight characters with four classes).
- **Default taken**: `password` (six) for what an admin sets, `passwordChange` (strong, with the current password verified) for what a user sets themselves. Each rule is one schema used by its form and its action.
- **Alternative set aside**: one strong rule everywhere, which would break the reset button's fixed temporary password and change what admins may type today.
- **Re-read when**: the reset flow generates its temporary password.

## 2026-09-20 · phase 4 · the mail pair fails at boot, the rest stays optional

- **Situation**: VALID.3 says tightening a value moves a failure from use to boot and is a decision. `RESEND_API_KEY` without `RESEND_FROM` used to fail at the first send with a provider error.
- **Default taken**: `serverEnv` refuses a half-set mail pair, and a partial Cloudinary trio, on its first read; `DATABASE_URL` is required (the app cannot run without it); `NEXTAUTH_URL` stays optional, and a mail link uses it, else an explicitly set `NEXT_PUBLIC_APP_URL`, else the send fails (the reviewer caught the first draft falling back to the production literal, which would have mailed a preview's links to production; an unset value used to print `undefined/`).
- **Alternative set aside**: `.url()` on the two URLs and a required `NEXTAUTH_URL`, which would decide how production dies without knowing what it sets.
- **Re-read when**: the deployment's variables are inventoried (`vercel env`).

## 2026-09-20 · phase 4 · DATA-TENANT reads n/a; the isolation test is phase 10's

- **Situation**: the rule's probe looks for a tenant column and finds none: this schema scopes by `restaurantId`, and `lib/auth-guard.ts` scopes every action to it.
- **Default taken**: recorded as the probe's blind spot, not as absence. The negative test on a real database (one restaurant's admin reading another's rows) belongs with the integration suite of phase 10.
- **Alternative set aside**: a unit test against a mocked client, which cannot see a constraint or a query.
- **Re-read when**: phase 10 opens; write the isolation test first. **Closed 2026-09-21 (phase 10)**: `tests/integration/tenant-isolation.test.ts` is the negative test on the real database, through every guard and the actions; writing it found the subcategory hole (a dish could be placed under another restaurant's subcategory) and closed it.

## 2026-09-20 · phase 5 · no read is cached on the server; the probe guarantees it

- **Situation**: CACHE.1 and CACHE.2 govern cached reads: a key with every parameter, an invalidation on every write, a TTL, and never an authorisation decision. The plan allows "not applicable" with the reason. This application has no server cache layer: no store client, no `unstable_cache` or `"use cache"`, no client-side query cache; every dashboard and menu render reads Postgres (the dashboards are dynamic through `auth()`, the menu through its route parameter). What an open client does keep is Next's router cache of its preserved layout: the dashboards' shell, which lists every restaurant by name. The pinned catalogue wires no CACHE-* check for this stack.
- **Default taken**: not applicable for server caches, held by a machine: `cache.serverCacheUse` (`abatty.probes.mjs`) counts what creates a cached read (the three `"use cache"` forms, `unstable_cache`, `cacheLife`, `cacheTag`, a static or revalidating route export, a fetch cache option, a cache store import), reads 0 and is hard. For the router cache, CACHE.1's "every write invalidates" holds: the three restaurant writes (create, update, delete) call `revalidatePath` on both portal roots, which makes the action's response carry a fresh render from the root and the shell show the change without a reload (the standards-reviewer caught the first draft removing the update's revalidation as "stray"; it was the one invalidation the shell had).
- **Alternative set aside**: caching the public menu, the hot path behind the QR code. It is a design decision with a cost model (per-restaurant keys, invalidation from every dish, category and branding write, a TTL for the manifest and the JSON-LD), not a conformance fix; when it is taken, the probe goes red on the first cached read and this entry is re-read with CACHE.1 in hand.
- **Re-read when**: a cached read is introduced (the gate says so), or the menu's render time becomes a measured problem.

## 2026-09-20 · phase 5 · the two caches that do exist, and why they pass

- **Situation**: the per-restaurant manifest route answers with `Cache-Control: public, max-age=3600`; the service worker (`public/sw.js`) keeps a visited menu for offline use.
- **Default taken**: the manifest is a public read keyed by the restaurant slug in its URL (every parameter is in the key), carries no user data, and its TTL bounds how long a rebrand takes to reach an installed app: an hour, accepted. The service worker is a client cache keyed by URL and versioned by the build id, refreshed when the guest taps Refresh; its contract (never a stale shell, assets resolve) is the PWA track's, not CACHE.1's.
- **Alternative set aside**: `no-store` on the manifest, which would fetch it on every install check for no gain.
- **Re-read when**: the manifest carries anything per user, or the PWA track opens.

## 2026-09-20 · phase 5 · the session token is identity, never the authorisation decision

- **Situation**: CACHE.2 names an authorisation decision cached without a bounded TTL and an invalidation on every role change. The JWT carries `role` for its whole life; `requireUser` already re-reads the user on every action and route call, the manager pages scope every read by assignment, but the admin layout decided the role once per mount and Next preserves a layout across client navigations: a super admin demoted or deleted after the visit began kept reading admin pages until a full reload.
- **Default taken**: every admin page calls `requireSuperAdminPage()` first (a codemod over the 17 pages), which re-reads the user and redirects. The token's `role` is used only to pick a portal on sign-in.
- **Alternative set aside**: a role check in `proxy.ts` on every request. It would read the token, not the database, so it would be the cached decision the rule forbids; and a database read there would run on every asset request.
- **Re-read when**: a third role appears, or the session strategy changes.

## 2026-09-20 · phase 6 · an internal API: envelope, bounded lists and payloads, but no spec, keys or versions

- **Situation**: API.1 asks for one envelope, money as a decimal string, bounded followable lists, payload returns, `Idempotency-Key` on retryable writes, `If-Match` on racing writes and a versioning decision; API.2 for a spec generated from code and checked both ways; API.3 for GraphQL. This surface is five route handlers and 36 server actions, all first-party (two admin dialogs, a menu's view counter), no third-party client, no GraphQL. The pinned catalogue wires no API-* check.
- **Default taken**: the envelope (`lib/api.ts`), the bounded followable lists (`lib/schemas/list.ts`), money as a decimal string beside the ISO 4217 code, and payload returns, each held by a probe at zero (`api.bareResponse`, `api.unboundedList`, `api.rowReturn`). Not taken, with the reason: idempotency keys (no retryable write; the one public POST counts a view and a replay counts a view), `If-Match` (no write two people race: the settings form is one manager's, and the assignment routes set a whole list), versioning (an internal API changes with its one client in the same commit; the house default, a URL path prefix, applies the day a second client exists), an OpenAPI spec (five internal routes; generated from the zod schemas when a route is published), GraphQL (none).
- **Alternative set aside**: RFC 9457 `application/problem+json` for failures; the standard keeps `{ error, code }` where a client base exists, and the two dialogs are that client base. API.1's "deprecate; never delete a field in the same change" is also set aside here, on purpose: the bare-array shape of the two lists was replaced with its only client in the same commit (a first-party dialog in this repository); an admin tab open across the deploy calls the new shape with the old parser once, sees an empty dialog, and reloads. A client outside the repository would get the old shape one release behind a query flag.
- **Re-read when**: a route serves a client outside this repository, or a write can be retried by a client (a payment, an order).

## 2026-09-20 · phase 6 · a server action's signature stays `(id, data)`

- **Situation**: API.1's "a mutation takes one input object" is written for a wire API. A server action is a typed function call from this application's own forms.
- **Default taken**: the actions keep their `(rawId, raw)` arguments, each parsed (phase 4); the return is the payload rule's concern, held by `api.rowReturn`.
- **Alternative set aside**: folding every action into a single-object input, which rewrites 36 signatures and their callers for no client that could tell the difference.
- **Re-read when**: an action is exposed outside the forms that call it.

## 2026-09-20 · phase 7 · the shape rules at error, off only for a generated list the ratchet counts

- **Situation**: CODE-SHAPE wants `max-lines`, `max-lines-per-function`, `complexity` and `max-params` in the linter; 72 findings in 44 files at the standard's thresholds on the day the rules went in. The plan wants the exemption list generated from the debt, never hand-maintained.
- **Default taken**: the three function rules at error over the whole tree; `scripts/ci/shape-exemptions.json` written by `scripts/codemods/shape-exemptions.mjs --write` from the findings, refused by `pnpm lint` when a listed file passes (`--check`) or is gone, counted by `fn.shapeExemptions`; `max-lines` runs at error at the 800-line cap (the per-kind budgets stay the ratchet's `size.*` metrics, which the check credits only from a top-level `size` key this baseline does not have; the cap in the linter is what makes CODE-SHAPE read all four rules). Tests and browser specs are carved out of the length rule: a describe body is one long arrow by design. The list is empty and the metric hard at zero.
- **Alternative set aside**: the rules at warn under `--max-warnings=0`, which is the same thing with a worse name; a per-file `eslint-disable`, which the standard forbids.
- **Re-read when**: a threshold changes.

## 2026-09-20 · phase 7 · how "behaviour identical" was proven for a split component

- **Situation**: 44 files split into 130 new ones by four workers in parallel; a class or a string dropped in a JSX extraction is invisible to the type checker and to the unit tests.
- **Default taken**: each worker rendered the `git show HEAD:` copy and the replacement to static markup under the same props and several forced states (both locales, every mode, empty and full data) and compared byte for byte (69 scenarios for the uploads and viewers, 21 for the forms, 10 components for the menu and shell, every page for the pages), then diffed the multiset of classes, strings, attributes and tags; what a server render cannot reach (effects, handlers) was transcribed statement for statement and, where it carried logic, unit-tested (`lib/sign-in-checks`, `browser-upload`, `file-checks`, `model-viewer-attributes`, `ar-support`, `camera-controls`, `form-defaults`). The scratch harnesses were deleted; the proof is in the log and the commits.
- **Alternative set aside**: trusting the type checker and the 16 browser tests, which see one journey.
- **Re-read when**: a split touches a component with no server-rendered output to compare.

## 2026-09-20 · phase 7 · small non-identities accepted, and where things moved

- `cleanPhone`/`formatAddress` moved from the footer to `components/menu/contact-format.ts` (the footer columns needed them; a back-import would be a cycle); `ShellRole`/`ShellRestaurant` live in `components/shell/shell-types.ts` (no consumer outside the file existed; a type import that closes a value cycle still fails `no-circular`); `ContactFormValues` is defined in `components/contact/contact-form-values.ts` and re-exported from the panel for the settings form; `EditRestaurantValues` is re-exported from the form for its importers; the forms' default values (`restaurantFormValues`, `dishFormValues`) live in `components/forms/form-defaults.ts`, not `lib/`, because they name the forms' value types and `lib/` is a leaf.
- A three-way ternary whose arms were one class string is that string; `"cursor-pointer "` lost its trailing space; `<strong>Size:</strong> {n}` renders two text nodes; a props object built by a loop orders its keys differently; state moved into an always-mounted child keeps its lifetime; `useCallback` wrappers with no memoised consumer were dropped. None changes classList, textContent or a value a test or a user reads.
- The four uploads keep their own Cloudinary strings (`components/upload/browser-upload.ts`) rather than converging on `lib/brand-upload.ts`, whose messages differ: converging is a behaviour change for another day.
- The AR viewer's one mount effect became four hooks (script, controls, fullscreen, support); each keeps its cleanup and listens to different events, so order is not observable. The `@ts-expect-error` on `navigator.xr` is a typed view behind the same `'xr' in navigator` test.
- Left as found: a latent restart of `closeOf` on an unterminated `/*` (unreachable on parseable source); `key={index}` in the profile's activity list; `lib/opening-hours.ts` already at six exports; the settings form's `onSubmit` at complexity 12, the limit. Fixed on review: three same-arm ternaries carried across the split, two em-dashes in copy moved into new files, `localName` moved from a hook module to `lib/menu.ts`.
- Twenty-five of the new files export two to four sibling components (a card and its parts). The repository's rule is five exports per file (`.claude/rules/size-limits.md`); the standard's one-component-per-file is read here as one *concern* per file, a card with the parts only it renders. Re-read when a sibling gains a second consumer: it moves to its own file then.
- `components/forms/form-defaults.ts` (the row-to-form mappers) sits outside the `lib/**` coverage floor; it carries its own 126-line test. Deriving the forms' value types in `lib/schemas/` would let it move under the floor; a phase 9/10 tidy.

## 2026-09-20 · phase 8 · the size floors hard at zero; what the last eight pages kept

- **Situation**: after phase 7 the only files over a budget were eight pages (composition roots, 100 code lines), 103 to 152 lines each; `size.overRaw` was already 0.
- **Default taken**: each page keeps its data reads, its guard (the admin ones still start with `requireSuperAdminPage()`) and its redirects, and hands its markup to components; the public menu route keeps its two metadata selects and hands the metadata, viewport and loader to `lib/` modules with prisma-mocked tests that pin the query arguments (the `lib/**` coverage floor binds). The admin dishes page, under budget but a verbatim copy of the manager's row mapping, took the same seam. `size.overBudget` and `size.excessCode` are hard at 0: a new file over its kind's budget fails the gate (proven on a planted 102-line page).
- **Alternative set aside**: leaving the two list pages (66 and 78 lines) with their query inline above the 30-60 target; they are under the budget and a query belongs to the page.
- **Re-read when**: a page needs a second query and crosses 100 again: the query moves to a loader module, not the guard.

## 2026-09-20 · phase 8 · two small non-identities accepted

- The confirm-new page's icon box had a dead `${success ? '' : ''}` in its class, one trailing space in the attribute; it is the plain string, like confirm-old's. Nothing in `confirm-old-email.tsx` was reusable as-is, so the shared shape (status banner, bullet box, the invalid-link card) became three primitives in `components/manager/email-change-notice.tsx` and confirm-old moved onto them (proven identical in three states).
- The proof ran the menu's browser tests against the running dev server rather than a production build (a build was off limits to the worker); the full gate run locally before the commit, and the CI run on the push, ran them against the build.
- `components/shell/dish-list-rows.ts` (a Prisma row to a dish list row) sits under `components/`, outside the `lib/**` coverage floor, with its own test, for the reason `form-defaults.ts` does: its row type is the list component's. The same phase 9/10 tidy applies.
- The phase 3 entry's trigger ("rename `role` to `portal` when phase 8 touches the shells") fired: the rename is a codemod over the five components and their call sites, done right after phase 9's flags land, so it does not collide with the type work in flight in the same files.

## 2026-09-21 · phase 9 · the two strict flags: how 140 errors were fixed, and what was not a codemod

- **Situation**: `noUncheckedIndexedAccess` (53 errors) and `exactOptionalPropertyTypes` (86) went on together. Two fix shapes repeated: an index read guarded or replaced by a typed shape, and a forwarded optional prop widened to `?: T | undefined` (about 55 declarations in 37 files).
- **Default taken**: each site was fixed from its own `tsc` error and verified by the next run: a widening only where a parent genuinely passes `undefined` (`disabled` chains, form value types, `hint`/`description`), a conditional spread where the receiver must not see the key (Prisma inputs through `definedFields()`, a Radix `defaultValue`, the provider pair), a guard where the index can miss. The widening is one textual edit in more than ten files, which CODE.11 would call a codemod; it was not written as one because the choice at each site (widen, spread, guard) is what the type error decides, and a transform that widened blindly would have hidden the sites where a spread was right (`Switch.checked`, `RegisteredField.placeholder` stayed narrow).
- **Alternative set aside**: zod 4.6's `.exactOptional()` on the schemas, which hands `undefined` to the inner type at runtime and fails a form that sends a key with `undefined`; a blanket widening codemod.
- **Re-read when**: a third flag arrives, or a widened prop turns out to be fed `undefined` by nobody (narrow it then).

## 2026-09-21 · phase 10 · the integration harness: one rolled-back transaction, the singleton proxied, constraints left to the migrations

- **Situation**: TEST.2 wants a real Postgres in a rolled-back transaction with no ORM mocking; the code under test reaches the database through the client singleton and the session through `auth()`.
- **Default taken**: each test runs inside a Prisma interactive transaction that a sentinel error rolls back; `@/lib/prisma` is a proxy to that transaction (the ORM itself is not mocked: every query, guard and action runs unchanged on real rows), `@/auth` answers the row the test signed in as, `next/cache` is a no-op outside a request. The runner reads `TEST_DATABASE_URL` only (CI's service, or a throwaway container it starts), never `DATABASE_URL`. A constraint violation would abort the transaction every later query shares, so the suite tests the schema's refusals (they come first) and leaves the constraints to the migrations; a savepoint helper is the next step if a constraint test is wanted.
- **Alternative set aside**: Testcontainers (a dependency for what one docker command does); truncating tables per test (slower, and it would erase the seed the browser suite needs on CI's shared service).
- **Re-read when**: a test needs to observe a constraint violation, or the suite outgrows one connection.

## 2026-09-21 · phase 11 · JSDoc held on the boundary surface and on every export there, not on components

- **Situation**: CODE.7 wants `jsdoc/require-jsdoc` `publicOnly` on the exported surface: functions in service and library code, hooks, permission checks, and any schema whose shape encodes a decision. 308 exports had no block on 2026-09-21: 121 on `lib/**`, `app/actions/**`, `app/api/**`, `auth.ts` and `proxy.ts`, 187 on `components/**`.
- **Default taken**: the rule at error on those five paths only, with `no-types` at error and the fixer off (`enableFixer: false`: an empty `/** */` satisfies the rule and documents nothing, and the reviewer found the first draft had left the fixer on). Its contexts are function declarations, every exported `VariableDeclarator`, the default export (an arrow, a zod schema, a payload select, a table: the plugin's arrow-only context left `export const x = z.object(...)` unseen, which the lib worker noticed and the reviewer would have missed), exported types and interfaces. A block states what the code does not say on its own: which guard, which schema, what is answered, what is refused, the number's origin (the ten-minute code names `OTP_TTL_MS`, the fifteen-minute link names the action that stores it). Components are not held: a component's contract is its props type and its markup, and a block there restates the props, which is the rot `no-types` exists to prevent.
- **Alternative set aside**: the plugin's `flat/recommended-typescript-flavor` preset (it pairs every `@param` and `@returns` on every function, private ones too, which the standard does not ask and the surface would answer with tags rather than sentences); holding `components/**` (187 blocks about props); a repository probe instead of the plugin (the plugin sees the AST the probe would approximate).
- **Re-read when**: a component gains a rule its props do not say (then that file joins the held list), a hook module appears outside `lib/`, or a block is found restating a signature (then the standard's "what a reader would get wrong" was not applied).

## 2026-09-21 · phase 11 · what each living doc is verified against

- **Situation**: DOC.5 measures a document's freshness by the diff: `source_truth` names the files it describes, `last_verified` the day it was last read against them, and `docs.behindCode` counts the docs a cited file has moved past.
- **Default taken**: `docs/README.md` cites `docs/ADOPTION_STATE.json` and `abatty.config.json` (the index changes when the programme's state or its instrument does); `docs/LESSONS.md` cites `CLAUDE.md` and `.claude/rules/size-limits.md` (a lesson lives behind a line of one of them); `docs/ADOPTION_DECISIONS.md` cites `abatty.config.json`, `docs/ADOPTION_STATE.json` and `eslint.config.mjs` (a decision is a config line with its reason); `docs/STANDARDS_PROGRESS.md` cites `scripts/ci/standards-baseline.json`, `abatty.probes.mjs` and `docs/ADOPTION_STATE.json` (its scoreboard is the baseline read aloud). The date moves in the commit that changes a cited file, after the doc was re-read against it: every phase close moves the baseline and the state, so the progress and index docs are re-dated at every close.
- **Alternative set aside**: citing the whole tree (every commit would stale every doc, and the number would say nothing); no `source_truth` at all (DOC-FRESHNESS partial for good, and a doc's date meaning "someone opened it").
- **Re-read when**: a cited file is renamed or split, or a doc starts describing a file it does not cite.

## 2026-09-21 · phase 12 · duplication as a ratchet: jscpd at its defaults, run by the probe, tests left out

- **Situation**: CODE.12 (a SHOULD) wants jscpd over the source root, read by the ratchet as `dup.clones` and `dup.clonedLines`, or the decision not to measure. The pinned abatty has no jscpd reader of its own, and a probe's scan is synchronous.
- **Default taken**: measured. `abatty-probes/dup.mjs` runs jscpd itself (`execFileSync`, one run per scanned directory, kept for the process) at the tool's default thresholds (five lines, fifty tokens: the standard says "jscpd over the source root", and a threshold tuned for a nicer number would be the number tuning the rule), over the roots the graph script cruises, with tests, browser specs and the generated client left out (a test describes a behaviour per block and repeats itself by design; the shape rules make the same carve-out). A clone is charged to the file jscpd lists first, so the per-file floors hold. jscpd 4.3.0, the last pure-JavaScript line: 5.x ships a native prebuilt binary per platform, which is more supply chain than a duplication count is worth.
- **Alternative set aside**: a committed report read by the probe (stale the moment code moves, and a `--check` per commit to keep it honest, as the shape exemptions needed); a `dup` gate step (the preset's gate has no slot for one, and a count that may only fall is what a ratchet is for); not measuring (82 clones and 1064 lines is a number worth watching: 28 clones under the two portals' pages, 50 under components).
- **Re-read when**: the count reaches a floor no split lowers (then the thresholds are the question), or abatty ships a jscpd reader (then the probe goes).

## 2026-09-21 · phase 12 · the boundary map for this layout, and the arrow left out

- **Situation**: CODE.5 wants one dependency-cruiser rule per arrow of the boundary map that must not exist. The template's two example rules named `src/features` and `src/components`, which this repository does not have, so the graph step held `no-circular`, `no-orphans` and `lib -> app|components` only.
- **Default taken**: five arrows, each a rule and each proven red on a planted import: `lib/` imports nothing above it; `components/` imports `app/actions/*` only (a page, a layout, a route and its helpers are composed by `app/`, never imported by a component); `app/actions` and `app/api` import no component (they answer data); the modules holding a secret or the database client (`lib/prisma`, `lib/mail`, `lib/cloudinary`, `lib/auth-guard`, `lib/otp-request`, `lib/sign-in-checks`, `auth.ts`) are reached from a component through a server action only; `components/admin` and `components/manager` never import each other (what both need lives in `components/shell` or `components/forms`). The map is written in `CLAUDE.md` under "Boundary map" so the rules have a sentence to point at.
- **Alternative set aside**: `lib/env` on the server-only list (it is shared on purpose: `publicEnv` is the browser's, `serverEnv` parses lazily, and the rule would forbid the two upload components and the PWA hook their public reads); moving the server-only modules under a `server/` directory as the standard's layout has it (a relocation of seven modules and their 53 importers, not this phase's; phase 13 opens `server/` for the process-level modules and the rest may follow).
- **Re-read when**: a component needs a module on the server-only list (it needs a server action instead), or a third portal appears.
