---
title: "Deployment"
description: "How Foodify reaches production on Vercel: what the build runs, how a schema change reaches the database, the environment it needs, and what to check after a deploy."
category: operations
status: living
audience: ["developer", "agent"]
tags: ["deployment", "vercel", "prisma", "environment"]
related: ["./README.md", "./TESTING.md"]
source_truth: ["package.json", "lib/env.ts", "prisma/schema.prisma", "prisma/pos.prisma", "next.config.js"]
last_verified: "2026-09-25"
---

# Deployment

Production is a Vercel project building `main`, and only `main`: `vercel.json` turns automatic
deployments off for every other branch (`git.deploymentEnabled`, `"**": false` with `"main": true`;
`**` because a bare `*` does not match a `/` in `feat/…`), so a pull request gets no preview and
spends no build. Test a branch locally, or deploy one by hand with the Vercel CLI. The database is
a Neon Postgres. Nothing here is automatic unless it says so.

## What the build runs

`vercel-build` in `package.json`: `prisma generate && next build`. That is all. The build
**never touches the database**: it does not migrate, push or seed. Keep it that way. An older
version of this guide put `prisma db push --force-reset --accept-data-loss && prisma db seed` in
the build, which empties the database on every deploy. `--force-reset` belongs to
`pnpm db:setup`, a local command for a database you mean to throw away, and nowhere else.

The package manager is pnpm (`pnpm install --frozen-lockfile`); `postinstall` generates the
Prisma client into `generated/prisma`. `next.config.js` builds `output: 'standalone'` and sets the
security headers (`X-Frame-Options: DENY` on both portals).

## A schema change

Migrations live in `prisma/migrations/` and are applied with `prisma migrate deploy`, which only
runs the migrations not yet applied and never resets anything.

1. Write the migration locally against a disposable database (`pnpm prisma migrate dev`) and
   commit it with the schema change.
2. CI applies every migration to its own Postgres and runs the integration and browser suites on
   the result (`.github/workflows/checks.yml`).
3. **Before** the deploy that needs it goes live, apply it to production by hand:
   `DATABASE_URL=<production> pnpm exec prisma migrate deploy`. Nothing does this for you today:
   neither the build nor CI touches the production database.

`20260924090000_push_subscriptions` (the `PushSubscription` table) is such a migration: deploy it
before the build that ships Web Push, or every subscribe from a staff device fails and every
push is logged as not sent.

`20260925090000_pos_groundwork` (the POS tables of `prisma/pos.prisma`, `Restaurant.posEnabled`,
`Order.externalId`, `Order.posCheckId`, `Order.posPaidAt`, `OrderChange.source`) is additive: every
restaurant starts with no connection, and nothing is sent until its owner connects one.
`Restaurant.posEnabled` is deprecated and read by nothing (POS is every restaurant's, no switch);
it is dropped with the subscription-plan work, in a migration deployed after the code that stops
naming it. But the code reads the new tables on every change to an order, POS
or not, so deploy it before the build that ships Settings → Integrations: without it, placing an
order (guest or waiter), every board move (accept, ready, served, cancel), removing a dish,
answering a request, voiding, and closing a bill all fail.

Write migrations the running version survives (add a column before the code reads it, stop
reading it before it is dropped): for a moment, the old deploy runs on the new schema.

## Environment

`lib/env.ts` is the one reader of `process.env` and parses it at boot; a deploy with a missing
required variable, or half of a pair, fails at its first request rather than at its first email.

| Variable | Required | What it does |
|---|---|---|
| `DATABASE_URL` | yes | The Neon connection string. Use `sslmode=verify-full` (pg 8 treats `require` as that and warns that it will not in pg 9). |
| `NEXTAUTH_SECRET` | yes | Signs the session cookie. Read by Auth.js itself, not by `lib/env.ts`. |
| `NEXTAUTH_URL` | on production | The dashboards' origin, for links in email. A preview with neither this nor `NEXT_PUBLIC_APP_URL` fails the send rather than mailing a production link. |
| `NEXT_PUBLIC_APP_URL` | on production | The public origin in QR codes and structured data; unset, it falls back to `https://foodify.app`. |
| `RESEND_API_KEY` + `RESEND_FROM` | together or neither | Sign-in codes and account email. Unset, the code is stored but never delivered, so an account with the second factor on cannot finish signing in. |
| `BREVO_API_KEY` + `BREVO_SMS_SENDER` | together or neither | The guest's order confirmation by SMS. Unset, nothing is sent and the order still stands. |
| `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` | all or none | Photos and AR models, in `restaurants/{slug}/` folders. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` | all or none | Web Push to the staff apps (`server/push.ts`): a new order wakes the kitchen boards, a ready one the waiter's phone, with the app in the background or the screen locked. Generate the pair once with `pnpm exec web-push generate-vapid-keys` and keep it: a new pair orphans every device already subscribed until it opens the app again. The public key is inlined into the browser bundle at build time, so set it before the build. `VAPID_SUBJECT` is a `mailto:` or `https://` address the push services may contact. Unset, no device can subscribe and nothing is sent; the boards still poll and chime while open. |
| `POS_ENCRYPTION_KEY` | to connect a POS | The key a POS connection's credentials are sealed with (AES-256-GCM, `server/pos-crypto.ts`): 32 random bytes as base64, generated once with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Unset, connecting is refused ("POS integration is not configured on this server") and nothing is sent. Never replace it in place: every stored credential names the key it was sealed under (`POS_ENCRYPTION_KEY_ID`, `k1` by default), and a new key without that path makes them unreadable. Rotation is a second key id, a re-seal of every connection, then the old key retired. |
| `POS_ENCRYPTION_KEY_ID` | optional | The name stored beside each sealed credential; `k1` unless set. Change it only together with a new key, as part of a rotation. |
| `CRON_SECRET` | for the POS cron | The bearer token Vercel's cron sends to `/api/pos/outbox` (at least 16 characters; Vercel sends it by itself once the variable is set on the project). Unset, the route refuses every call and the outbox is swept only after a send and when a board polls. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | optional | Unsigned uploads straight from the browser; unset, uploads go through a server action. |

`.env.example` lists them with placeholders, except the three POS variables (`POS_ENCRYPTION_KEY`,
`POS_ENCRYPTION_KEY_ID`, `CRON_SECRET`), which have to be added to it by hand. Off Vercel (a production build on another host or
port), Auth.js also needs `AUTH_TRUST_HOST=true`, or every page reads as signed out.

## The POS outbox cron

`vercel.json` schedules `GET /api/pos/outbox` daily at 05:00 UTC (`"0 5 * * *"`), the most the
Hobby plan allows. It sends whatever the other two triggers missed (a sweep right after each
event, and one at most every thirty seconds while a kitchen board or a waiter's phone polls, for a
restaurant with an active POS). On Vercel Pro it can run every minute (`"* * * * *"`), which bounds
how long a missed send waits. Delivery is at least once: a send the POS took but whose answer was
lost (a timeout, an instance stopped mid-send) is sent again with the same idempotency key (the
outbox row's id), which the POS adapter must use to recognise it. It answers a summary, errors
counted, never a 500.

## Never on production

- `pnpm db:setup` (it resets the database) and `prisma db push` (it applies the schema without a
  migration, and can drop data to make it fit).
- `prisma db seed`: the seed creates a super admin and a manager with the password `changeme`.
  It is for development, CI and the browser suite; production accounts are made in the admin portal.

## After a deploy

- `GET /api/health` answers 200 when the database answers `SELECT 1`; 503 `unavailable` without
  it, 503 `draining` while an instance shuts down (`server/drain.ts`). It is the one URL a
  monitor should watch.
- Sign in at `/admin/login` and `/manager/login`, open a restaurant's public menu at
  `/restaurant/<slug>`, and open a dish with a model on a phone (Quick Look on iOS reads USDZ,
  Scene Viewer on Android reads GLB).
- If a restaurant takes orders, place one from its menu and watch it reach the kitchen board
  (`/kitchen/<code>`). The addresses tablets installed before, `/kitchen/orders/<code>` and
  `/kitchen/menu/<code>`, still serve the same screens: rewrites in `next.config.js`, not
  redirects, so an installed tablet opens inside its own scope and picks up the new manifest.
- A new service worker waits for the guest to tap Refresh: a tab already open keeps the previous
  version until then, by design.
