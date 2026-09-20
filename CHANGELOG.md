# Changelog

Keep a Changelog, SemVer. Every commit that touches source, tests, scripts, CI, migrations or docs adds a line under Unreleased in the same commit (CHANGE.1, CHANGE.2).

## [Unreleased]

### Added

- The engineering standard's instrument: harness, gate, import graph, dead code (`abatty init`).
- `lib/auth-guard.ts`: `requireSuperAdmin`, `requireRestaurantAccess` and the dish, ingredient, category and subcategory variants; every exported server action now starts with one.
- `docs/LESSONS.md`, the lessons catalogue behind `CLAUDE.md`.
- Security headers (`nosniff`, `Referrer-Policy`; `X-Frame-Options: DENY` on the dashboards) and zod validation on `POST /api/dish-views`.
- "Quiet Plate" design system: warm neutral tokens, Basil accent, hairline cards, one admin/manager shell, rebuilt customer menu; Settings form grouped into General / Contact & hours / Branding tabs.

### Changed

- `GET /api/users` and `GET /api/restaurants` require a super admin and return only `id/email/role` and `id/name/slug`; the two assignment routes require a super admin.
- Sign-in failures return one message; one-time codes come from `crypto.randomInt` and are compared in constant time.
- Reorder actions scope their updates to the parent restaurant or category.
- `build` / `vercel-build` no longer run `prisma db seed`; `pnpm-lock.yaml` ships to Vercel.
- ESLint config is `root: true` (no cascade into a parent checkout).

### Removed

- `/api/seed`, `/api/setup`, `/api/deploy`.
- Unused dependencies (`framer-motion`, `@headlessui/react`, `@dnd-kit/modifiers`, three Radix packages, `@tailwindcss/postcss`), unused UI primitives, and nine unused server-action exports (`listAdmins`, `deleteAdmin`, `listClients`, `deleteClient`, `listDishes`, `updateDishPrice`, `getDishDetails`, `listRestaurants`, `listRestaurantsForUser`).
