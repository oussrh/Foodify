# Changelog

Keep a Changelog, SemVer. Every commit that touches source, tests, scripts, CI, migrations or docs adds a line under Unreleased in the same commit (CHANGE.1, CHANGE.2).

## [Unreleased]

### Added

- CI (`.github/workflows/checks.yml`): the gate's steps on every push and pull request, frozen install, production audit, production build; a pull-request template with the gate's checklist.
- The engineering standard's instrument: harness, gate, import graph, dead code (`abatty init`).
- `lib/auth-guard.ts`: `requireSuperAdmin`, `requireRestaurantAccess` and the dish, ingredient, category and subcategory variants; every exported server action now starts with one.
- `docs/LESSONS.md`, the lessons catalogue behind `CLAUDE.md`.
- Security headers (`nosniff`, `Referrer-Policy`; `X-Frame-Options: DENY` on the dashboards) and zod validation on `POST /api/dish-views`.
- "Quiet Plate" design system: warm neutral tokens, Basil accent, hairline cards, one admin/manager shell, rebuilt customer menu; Settings form grouped into General / Contact & hours / Branding tabs.
- Public menu PWA: offline precache, versioned worker with a Refresh-to-update flow, per-restaurant manifest, JSON-LD, route states.
- `lib/env.ts`, the env module (`publicEnv`): the client-safe Cloudinary, build-id and production reads live there; the ratchet's `valid.rawEnv` exempts it.

### Changed

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
