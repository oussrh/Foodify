# Foodify

Foodify puts a restaurant's menu on a guest's phone, with dishes they can place on the table in
augmented reality. A guest scans a QR code, reads the menu in English or French, opens a dish in
3D or AR, and — where the restaurant takes orders — orders from the table. The kitchen works the
orders on a tablet, the waiters carry them out from their phones, and the restaurant manages its
menu, people and settings in a web portal, with a report on how the menu is read and served.

## Who uses what

| Who | Where | What |
|---|---|---|
| Guests | `/restaurant/<slug>` (from the QR code) | The menu, dishes in 3D and AR, ordering |
| Kitchen | `/kitchen` (a tablet, username and password) | The order board, sold-out dishes |
| Waiters | `/waiter` (a phone, username and password) | The tables, taking orders, carrying them out |
| Managers | `/manager` | Their restaurants: menu, dishes, orders, tables, people, insights, settings |
| Super admins | `/admin` | Every restaurant and account |

## Stack

Next.js 16 (App Router) with React 19 and TypeScript · Tailwind CSS 4 with shadcn/ui primitives ·
Postgres (Neon) through Prisma 7 · Auth.js v5 with an optional second factor by email ·
Cloudinary for photos and AR models · Resend for email, Brevo for SMS · deployed on Vercel.

## Running it

```bash
pnpm install
pnpm dev
```

`.env.example` lists the environment; only `DATABASE_URL` and `NEXTAUTH_SECRET` are required to
start. `pnpm db:setup` resets a **local** database, applies the schema and seeds a restaurant with
two accounts (`ousrh7@gmail.com` and `owner@foodify.test`, password `changeme`).

## Checks

`pnpm run gate:fast` before a push (lint, types, the import graph, dead code, unit tests, the
standards ratchet; the pre-push hook runs it). `pnpm test:integration` runs the database suite on a
real Postgres, `pnpm e2e` the browser suite on the production build.

## Where to read more

- [`CLAUDE.md`](./CLAUDE.md) — the architecture: where each part of the app lives and why.
- [`docs/`](./docs/README.md) — deployment, testing, the standards scoreboard and the decisions behind it.
- [`CHANGELOG.md`](./CHANGELOG.md) — what changed, and why.
