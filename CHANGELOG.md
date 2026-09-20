# Changelog

Keep a Changelog, SemVer. Every commit that touches source, tests, scripts, CI, migrations or docs adds a line under Unreleased in the same commit (CHANGE.1, CHANGE.2).

## [Unreleased]

### Added

- `.gitattributes`: every text file is LF in the working tree as well as the index (`* text=auto eol=lf`), so a Windows checkout no longer flips docs to CRLF, which abatty's front-matter parser misreads.
- Unit suite (Vitest, `pnpm test`): 85 tests over the shared layer (opening hours, social links, brand colour, pricing and locale, brand uploads, TOTP, JSON-LD) with the coverage floor for `lib/**` pinned in `vitest.config.ts` at the measured figure; `docs/TESTING.md` lists the floor and every exclusion; `pnpm test:changed` holds the floor over the files a push changed (CI runs it).
- CI (`.github/workflows/checks.yml`): `pnpm run gate` (the pre-push hook's script) and a production audit on every push and pull request, frozen install; a pull-request template with the gate's checklist.
- The engineering standard's instrument: harness, gate, import graph, dead code (`abatty init`).
- `lib/auth-guard.ts`: `requireSuperAdmin`, `requireRestaurantAccess` and the dish, ingredient, category and subcategory variants; every exported server action now starts with one.
- `docs/LESSONS.md`, the lessons catalogue behind `CLAUDE.md`.
- Security headers (`nosniff`, `Referrer-Policy`; `X-Frame-Options: DENY` on the dashboards) and zod validation on `POST /api/dish-views`.
- "Quiet Plate" design system: warm neutral tokens, Basil accent, hairline cards, one admin/manager shell, rebuilt customer menu; Settings form grouped into General / Contact & hours / Branding tabs.
- Public menu PWA: offline precache, versioned worker with a Refresh-to-update flow, per-restaurant manifest, JSON-LD, route states.
- `lib/env.ts`, the env module (`publicEnv`): the client-safe Cloudinary, build-id and production reads live there; the ratchet's `valid.rawEnv` exempts it.

### Changed

- Dependencies to the latest of their current majors: `next` 15.5.25 (two unauthenticated RCEs, DoS, SSRF and middleware-bypass advisories closed), `next-auth` 5.0.0-beta.32 and `@auth/prisma-adapter` 2.11.3 (`@auth/core` 0.41.3: auth-check bypass and email-normalisation advisories closed), React 19.3, Prisma 6.19, zod 4.6, react-hook-form 7.88, Radix, resolvers, types and tooling. `abatty` pinned to commit 6fc516c (upstream HEAD spawns `.cmd` files without a shell again). Still open: `postcss` 8.4.31 pinned by Next 15 and `deepmerge-ts` by Prisma 6, both cleared by the next two majors.
- CI passes the pushed range to the gate (on `main` the checkout left it empty, so the build suite was skipped) and runs the audit last, after the changed-lines coverage.
- `abatty.config.json`: a change under `.github/` needs a changelog line, like source (CHANGE.1).
- `pnpm lint` names its directories (`app`, `components`, `lib`, `test`, `types`) and the root files, so the test fixtures and `vitest.config.ts` are linted too.
- `GET /api/users` and `GET /api/restaurants` require a super admin and return only `id/email/role` and `id/name/slug`; the two assignment routes require a super admin.
- Sign-in failures return one message; one-time codes come from `crypto.randomInt` and are compared in constant time.
- Reorder actions scope their updates to the parent restaurant or category.
- `build` / `vercel-build` no longer run `prisma db seed`; `pnpm-lock.yaml` ships to Vercel.
- ESLint config is `root: true` (no cascade into a parent checkout).
- `lib/brand-upload.ts` no longer imports `app/actions`; the branding tile passes the server-action fallback in (import-graph rule `data-layer-is-a-leaf`).

### Removed

- `/api/seed`, `/api/setup`, `/api/deploy`.
- Unused dependencies (`framer-motion`, `@headlessui/react`, `@dnd-kit/modifiers`, three Radix packages, `@tailwindcss/postcss`), unused UI primitives, and nine unused server-action exports (`listAdmins`, `deleteAdmin`, `listClients`, `deleteClient`, `listDishes`, `updateDishPrice`, `getDishDetails`, `listRestaurants`, `listRestaurantsForUser`).
- `findBrandFont` (never called).

### Fixed

- `no-debugger` is an ESLint error (the gate's lint control stayed green without it); knip also watches `src/` so the dead-code control is meaningful.
- Placeholder credentials in `.env.example` and `DEPLOYMENT.md` use `<angle-bracket>` form; the real Cloudinary cloud name and API key are scrubbed from the example.
- abatty runs on Windows: `patches/abatty@0.2.0.patch` gives its npm spawns a shell (Node ≥ 20.12 refuses `.cmd` files without one).
