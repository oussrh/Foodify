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

- `otplib` 13 (`verifySync`; it refuses secrets under 16 bytes, which no stored secret and no code hits: a future enrolment uses `generateSecret()`), `resend` 6, `lucide-react` 1.47 (brand logos are gone from Lucide: the Instagram, Facebook and X glyphs the footer and the contact panel show now live in `components/social-icons.tsx`, the Lucide 0.525 shapes under its ISC licence). Held back with the reason recorded: TypeScript 7 (typescript-eslint supports `<6.1`), ESLint 10 (see above), Prisma 8 (a release candidate), `@types/node` 26 (the runtime is Node 22/24).
- Tailwind CSS 4.3: `tailwind.config.ts` is gone, the design tokens are declared in `app/globals.css` (`@theme`, `@custom-variant dark`, `@plugin 'tailwindcss-animate'`, the `container` utility) by the official upgrade tool, which also renamed the utilities v4 renamed in 52 files (`shrink-0`, `outline-hidden`, `ring-3`); PostCSS runs `@tailwindcss/postcss` alone (autoprefixer is built in). Buttons keep the pointer cursor v4 removed. Verified on the production build: the public menu and the manager dashboard render as before.
- Prisma 7.10: the client is generated into `generated/prisma` (gitignored) by the `prisma-client` generator and talks to Postgres through `@prisma/adapter-pg`; the connection URL and the seed command live in `prisma.config.ts`; the seed is `prisma/seed.ts` run by `tsx`; `DATABASE_URL` is read through `lib/env.ts` (`serverEnv`), as is the public app URL (`publicEnv.appUrl`). Coverage floor for `lib/**` raised to 93.0 / 81.3 / 79.4 / 93.3 with tests for `lib/env.ts`. The Prisma CLI is a devDependency (a build tool; Vercel installs it for the build); `pnpm.overrides` lift its `deepmerge-ts` and `mysql2` to patched releases, and `pnpm audit --prod` reports no known vulnerabilities.
- Next.js 16.3.5: Turbopack builds, `proxy.ts` replaces `middleware.ts`, `typedRoutes` out of experimental, `images.remotePatterns` instead of `domains`, `outputFileTracingRoot` pinned to the project. `pnpm lint` is `eslint .` over an ESLint flat config (`eslint.config.mjs`: Next's core-web-vitals and TypeScript presets); the rules those presets add beyond Next 15 run at warn (137 findings on 2026-09-20, phases 1 and 9 drive them to zero). ESLint stays at 9.39: `eslint-config-next` 16 depends on `eslint-plugin-react`, `jsx-a11y` and `import` releases that do not support ESLint 10.
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

- `tsconfig.tsbuildinfo` (a type-checker cache, dirty after every run) and `.claude/settings.local.json` (per-machine tool permissions) are no longer tracked; both and `.serena/` are ignored.
- `.eslintrc.json` and `next lint` (gone in Next 16); the import graph's one known violation (root `middleware.ts` read as an orphan), fixed in the rule rather than carried.
- `/api/seed`, `/api/setup`, `/api/deploy`.
- Unused dependencies (`framer-motion`, `@headlessui/react`, `@dnd-kit/modifiers`, three Radix packages, `@tailwindcss/postcss`), unused UI primitives, and nine unused server-action exports (`listAdmins`, `deleteAdmin`, `listClients`, `deleteClient`, `listDishes`, `updateDishPrice`, `getDishDetails`, `listRestaurants`, `listRestaurantsForUser`).
- `findBrandFont` (never called).

### Fixed

- Three empty `interface X extends Y {}` in `components/ui/` are type aliases; the WebXR `@ts-ignore` says why it expects an error.
- `no-debugger` is an ESLint error (the gate's lint control stayed green without it); knip also watches `src/` so the dead-code control is meaningful.
- Placeholder credentials in `.env.example` and `DEPLOYMENT.md` use `<angle-bracket>` form; the real Cloudinary cloud name and API key are scrubbed from the example.
- abatty runs on Windows: `patches/abatty@0.2.0.patch` gives its npm spawns a shell (Node ≥ 20.12 refuses `.cmd` files without one).
