# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Foodify is an AR menu platform that allows restaurants to display dishes in Augmented Reality. The platform consists of:
- Customer-facing AR viewer accessed via QR codes
- Multi-tenant restaurant management dashboard (admin/manager portals)
- Multi-language support (English/French)

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build the application
pnpm build

# Lint code
pnpm lint

# Type checking
pnpm type-check

# Database operations
pnpm db:setup     # Reset DB, generate schema, and seed data
pnpm db:seed      # Seed database with sample data
pnpm prisma       # Access Prisma CLI
```

## Architecture & Key Concepts

### Multi-Tenant Structure
- **Super Admins**: Manage all restaurants and users
- **Restaurant Admins**: Manage their assigned restaurants
- URL routing: `admin.domain.com` for admin panel, `restaurant-slug.domain.com` for customer views

### Authentication & Security
- NextAuth v5 with credentials + an opt-in second factor per account (`User.mfaEnabled`, the checkbox on each portal's Account page: emailed OTP, or TOTP when a secret is set); off, the password alone opens a session
- Role-based access control in `lib/auth-guard.ts` (`requireSuperAdmin`, `requireRestaurantAccess`, dish/category variants); `proxy.ts` (Next 16's name for middleware) only rewrites subdomains
- Three roles (`UserRole`, named for people in `lib/roles.ts`): SUPER_ADMIN, RESTAURANT_ADMIN, and KITCHEN — an "Order tablet", a device account made on a restaurant's People tab that signs in at `/kitchen/login` with a password only, never a second factor, and works `/kitchen/orders/<id>` and nothing else. `requireRestaurantAccess` refuses KITCHEN; `requireBoardAccess` is the one guard it passes, so a tablet can never write to a menu. Sessions last a month (`auth.ts`).
- Prisma adapter for session management
- MFA support for both admin and manager accounts

### Database Schema (Prisma)
Key models and relationships:
- `Restaurant` → `MenuCategory` → `MenuSubcategory` → `Dish`
- `User` (SUPER_ADMIN/RESTAURANT_ADMIN) can manage multiple restaurants
- `Dish` includes AR assets (USDZ/GLB), images, multilingual content
- `DishView` tracks analytics (device type, AR usage)
- `ActivityLog` for audit trail

### AR File Management
- AR assets (USDZ/GLB files) uploaded to Cloudinary
- Organized in restaurant-specific folders: `restaurants/{restaurant-slug}/`
- Upload handling in `lib/cloudinary.ts` and `components/ar-file-upload.tsx`

### Component Architecture
- shadcn/ui primitives in `components/ui/` (restyled: hairline cards, no default shadows, `Table` for lists)
- `components/shell/` — the one admin/manager shell (`app-shell.tsx`: desktop rail, top bar with restaurant switcher, phone bottom tabs) plus `PageHeader`/`StatStrip`/`EmptyState`, list tables and row-action menus. Both protected layouts use it; role changes data scope, not components.
- `components/menu/` — customer-facing menu (`restaurant-page.tsx` composes `restaurant-page/*`: hero, bar, sections, the dish and filter sheets and their hooks; `dish-row.tsx`, `dish-body.tsx`, `dish-page.tsx`, `menu-footer.tsx`, `ar-launch-button.tsx`). Types and the dietary/allergen vocabulary live in `lib/menu.ts`, every word the menu says in `lib/menu-text.ts` (`MENU_TEXT`, the two languages held in step by `satisfies Record<Locale, unknown>`); Prisma → plain serializers in `lib/menu-data.ts`; the route's metadata and loader in `lib/menu-metadata.ts` and `lib/menu-loader.ts`.
- Ordering (`Restaurant.orderingEnabled`, Settings → General; `Restaurant.tableCount` is how many per-table QR codes the Tables tab prints, `components/qr/table-qr.ts` + `table-qr-sheet.tsx`, read by `lib/tables-loader.ts`): `components/menu/cart/` is the guest's order — the row `+`, the dish stepper, the per-dish note (`line-note.tsx`, one note per dish, stored as typed and trimmed only where it leaves), the bar, the order sheet and its form, `use-cart.ts` (one store per restaurant, `localStorage` via `lib/cart.ts`, followed across tabs), `use-place-order.ts`, and the checkout's table (read-only when `?table=` came from the table's own QR code, `table-field.tsx`) and phone. `restaurant-page/use-menu-cart.ts` joins it to the page. What is stored is ids and counts only: `POST /api/orders` re-prices every line from the database, refuses a dish that is not that restaurant's active menu, and numbers the order from `Restaurant.nextOrderNumber` (`Order`/`OrderLine`, the line's name and unit price copied at the time). Money never travels as a float: exact decimal strings, arithmetic in `lib/money.ts`. The guest's phone is required and stored on the order, never logged (`server/log.ts` redacts `phone`); the confirmation text is `lib/order-message.ts` and goes out through `lib/sms.ts` (Brevo transactional SMS, `BREVO_API_KEY` + `BREVO_SMS_SENDER`) — unlinked, it sends nothing and the order still stands.
- `components/waiter/` — the waiter's phone, installable (`/orders/manifest?portal=waiter`). `waiter-tables.tsx` runs **two** polls, open and served: `lib/waiter-floor.ts` reads the served ones inside `READY_WINDOW_MINUTES` as ready to carry (there is no delivered step; the heuristic and its cost are written down there) and builds one tile per table, ready outranking cooking. A tile that goes ready buzzes the phone — `use-ready-alert.ts`, vibration by default and sound only if the waiter asks, remembered per device, because a bell in a dining room is rude where the same bell on the pass is the point. `waiter-menu.tsx` searches both languages and jumps by category; `waiter-review.tsx` is the read-back before sending, holding the per-dish notes and the one for the whole order. One service worker for every staff app (`public/staff-sw.js`, cache keyed by registration scope; `components/staff/use-staff-pwa.ts` registers it for `/{portal}/orders/`, `/kitchen/` or `/waiter/`).
- Sold out: a dish the kitchen has run out of (`Dish.soldOutUntil`, null is available; `lib/availability.ts`). It stays on the menu, marked, and is not orderable — refused by `POST /api/orders` as well as hidden from the add button, because a cart is built in the guest's browser and can be older than the dish. It returns by itself at the next end of service day (04:00 UTC, not midnight: a kitchen is still open past midnight in some of these places) with no job running — a read after that moment simply sees an available dish. The devices get a screen of their own (`components/availability/`, `/kitchen/menu/<id>` and `/waiter/<id>/availability`: photo first, one tap, no save button); a manager toggles the same flag from the Stock column of the Dishes tab rather than a tab of its own. `requireServiceStaff` is the guard: managers, order tablets and waiters alike, and it is the only write a device account has over the menu.
- Insights: every restaurant's Insights tab (`/{portal}/restaurants/<id>/insights?grain=day|week|month|year`, `components/insights/`, read by `lib/insights-loader.ts`) counts dishes opened, AR sessions, dishes put in a cart, orders by a guest and by a waiter, and the average time from an order arriving to being accepted and to being served — bucketed by day, week, month or year, the grain in the URL. The buckets and the arithmetic are `lib/insights.ts` (a total re-weights an average by the orders behind it; an unfinished order is left out of one, never counted as a zero); the grouping is Postgres `date_trunc` in UTC. A view is recorded when a guest opens a dish and a cart add when a guest adds one (`components/menu/track.ts`, beacons to `/api/dish-views` and `/api/cart-adds`, fire and forget): a waiter's cart is not counted, because a staff order is counted as an order.
- People: every restaurant's People tab (`/{portal}/restaurants/<id>/users`, `components/admin/people-panel.tsx`, read through `lib/restaurant-loader.ts`) lists its managers and its device accounts, and a restaurant runs both. Devices: `app/actions/staff-actions.ts`, guarded by `requireRestaurantAccess` on the restaurant, and on **every** restaurant a device belongs to for a reset or a delete. Managers: `app/actions/restaurant-manager-actions.ts` — added by address (never a cross-tenant list), removed from this restaurant only, and re-passworded only when they manage no other restaurant, since a password is the account (`tests/integration/restaurant-people.test.ts`). Nobody changes their own row.
- `components/admin/` and `components/manager/` — the sections of the portal pages (headers, asides, tables, cards): a page under `app/` is a composition root (data reads, guard, redirects, at most 100 code lines) and hands its markup here. Forms are split by concern under `components/forms/`, `dish-form/`, `client-form/`, `restaurant-form/`, `password-form/`, `category-manager/`; uploads and viewers under `components/upload/`, `ar-viewer/`, `3d-viewer/`, `ar-preview/`, `qr/`.
- `components/orders/` — the kitchen board a tablet watches (`/{portal}/orders/<id>`, outside the shell so it fills the screen): `order-board.tsx` composes `board-header.tsx`, `order-columns.tsx` (the waiting / being-made lanes), `order-card.tsx` (one 64px move, the card itself opens the details) and `order-details-sheet.tsx` (every line, the call button, cancel behind a second tap), over `use-order-board.ts` (polls `GET /api/orders/board` every five seconds, reports offline rather than blanking), `use-chime.ts` + `chime-pattern.ts` (Web Audio, the alert's schedule as data; silent until the page is touched), `use-wake-lock.ts` and `use-orders-pwa.ts` (`public/orders-sw.js`, scoped to that portal's `/orders`, shell only and never the API; the manifest is `app/orders/manifest`). Statuses, the moves between them, the waiting tiers and the per-stage timings live in `lib/orders.ts`; one reading of an order (`boardOrderSelect` + `serializeOrder`) in `lib/order-data.ts` serves both the endpoint and the history; `app/actions/order-actions.ts` is the one writer and stamps `acceptedAt` / `servedAt` with the move that caused them. The Orders tab (`/{portal}/restaurants/<id>/orders`, in the shell) is the history plus the link to the board (`components/orders/history-screen.tsx`, `history-table.tsx`, `board-link-card.tsx`), read through `lib/restaurant-loader.ts`.
- `components/auth/sign-in-flow.tsx` — the single sign-in used by all admin/manager auth routes: password, then the emailed code when the account has the second factor on (the first step's `{ mfa }` says so), straight in when it is off.
- `components/account/` — the Account page cards shared by both portals (`/admin/profile`, `/manager/profile`): profile facts, the two-factor checkbox (`components/mfa-checkbox.tsx`, saves on change), the password form (`components/update-password-form.tsx` + `password-form/`). `components/manager/profile/` adds the manager's restaurants and the activity log (`ActivityLog`: email changes, password changes, two-factor on/off, written by `app/actions/profile-actions.ts`).
- Public menu PWA/SEO: `public/sw.js` (versioned by `?v=<build>`, registered by `components/menu/use-pwa.ts` in production only; scoped to `/restaurant/*`, Next static, images, fonts; the page posts a `PRECACHE` list so a visited menu works fully offline; new versions wait until the guest taps Refresh — never call `skipWaiting()` on install), `/offline` fallback page, per-restaurant manifest at `app/restaurant/[slug]/manifest/route.ts`, icons in `public/icons/`, JSON-LD from `lib/structured-data.ts`, route `loading`/`error`/`not-found` states. Guest language: `?lang=`, then `localStorage` (`LOCALE_STORAGE_KEY`), then browser, then restaurant default; prices via `formatPrice(price, Money)`.
- Feature forms (`create-*-form.tsx`, `edit-*-form.tsx`, category managers, uploads) are shared by both roles.

### Design system ("Quiet Plate")
- Tokens in `app/globals.css` (Tailwind 4: the `@theme` block maps them to utilities; there is no `tailwind.config.ts`); warm neutral ground, one accent "Basil", light + dark; radius encodes hierarchy (`rounded-sm` controls, `rounded-lg` cards, `rounded-sheet` sheets); shadows only on floating layers (`shadow-sheet`, `shadow-popover`).
- Font is Instrument Sans via `next/font` (`--font-sans`). Do not reintroduce Tailwind colour utilities (`bg-blue-500`, `text-gray-600`…) or gradients on chrome; use `primary`, `muted`, `success`, `warning`, `destructive`.
- Restaurant brand colours are never painted raw under text: `lib/brand-color.ts` derives a contrast-safe ink + tint, exposed as `text-brand`, `bg-brand`, `bg-brand-tint`, `text-brand-on` inside a `.brand-scope` element.
- `components/branding/` is the Settings → Branding tab: live phone preview (`menu-preview.tsx`), logo/cover tiles (`image-tile.tsx`, uploads persist immediately via `lib/brand-upload.ts`), colour presets + contrast readout, font picker (`lib/brand-fonts.ts`), and `Restaurant.menuTheme` (system | light | dark). A forced theme is applied as a `.light`/`.dark` class on the `.brand-scope` wrapper; `globals.css` defines both scopes.

### Boundary map (held by `pnpm run graph`, one dependency-cruiser rule per arrow)
- `lib/` is the shared layer and imports nothing from `app/` or `components/`; `components/` imports `app/actions/*` only (never a page, layout or route); `app/actions` and `app/api` import no component.
- `lib/prisma`, `lib/mail`, `lib/cloudinary`, `lib/auth-guard`, `lib/otp-request`, `lib/sign-in-checks`, `auth.ts` and `server/` are server-only: a component reaches them through a server action. `components/admin` and `components/manager` never import each other (what both need lives anywhere outside the two portal folders: `components/shell`, `components/forms`, the form directories).
- Dead code is a gate (`pnpm run dead`, knip at zero); duplication is a ratchet (`pnpm dup`; `dup.clones` / `dup.clonedLines` may only fall).

### Observability
- `server/log.ts` is the one writer of server output (pino, JSON lines; redaction by field path there and nowhere else: never mask at a call site, add the path); `no-console` is an error on `lib/`, `app/`, `server/`, `auth.ts`, `proxy.ts`, `instrumentation.ts`. Log ids, never addresses.
- `GET /api/health` answers 200 with `SELECT 1`, 503 `unavailable` without it, 503 `draining` after SIGTERM; `instrumentation.ts` registers the drain (`server/drain.ts`: health fails first, Next's own handler finishes the requests and exits; the pool is released only when a request outlives the ten-second grace). `/api/*` is never rewritten by `proxy.ts`, whatever the host.

### Server Actions Pattern
All data mutations use Next.js server actions in `app/actions/`:
- `dish-actions.ts` - CRUD operations for dishes
- `restaurant-actions.ts` - Restaurant management
- `admin-auth-actions.ts` - Admin authentication flows
- Actions handle file uploads, database operations, and validation
- Every export of a `'use server'` file is a public POST endpoint: the first line of each one is a guard from `lib/auth-guard.ts` (see `docs/LESSONS.md`), the next a zod parse of its arguments with a schema from `lib/schemas/` that the form validates with too (the ratchet's `valid.unparsedBoundary` is hard at zero). Unused exports are deleted, not kept "for later": `knip` fails the gate on them.

### Routing Structure
```
app/
├── admin/(auth)/          # Admin login, MFA
├── admin/(protected)/     # Super admin dashboard
├── manager/(auth)/        # Manager login, MFA  
├── manager/(protected)/   # Restaurant manager dashboard
├── restaurant/[slug]/     # Customer-facing restaurant pages
├── ar-viewer/            # AR model viewer
└── api/                  # API routes for external integrations
```

## Environment Variables Required

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Email (Resend)
RESEND_API_KEY="..."
RESEND_FROM="Foodify <no-reply@yourdomain.com>"

# Cloudinary (AR file storage)
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

## Key Development Patterns

### Form Handling
- React Hook Form with Zod validation
- Server actions for form submission
- Consistent error handling and loading states

### File Uploads
- Image uploads via standard form inputs
- AR file uploads (USDZ/GLB) via `ar-file-upload.tsx` component
- Automatic Cloudinary organization by restaurant

### Multi-language Content
- All user-facing content has `nameEn`/`nameFr` and `descriptionEn`/`descriptionFr` fields
- Components handle locale switching
- Default locale set per restaurant
- `Restaurant.openingHours` is JSON (`lib/opening-hours.ts`: per-day periods + note; legacy free text is kept as the note) and `socialMedia` is JSON keyed by network (`lib/social.ts`: an extensible registry `SOCIAL_NETWORKS`; a stored handle, phone or URL per network, still accepting legacy free text); the footer shows them as icons or text per `Restaurant.socialDisplay`. Edit them through `components/contact/` — never as raw strings.
- Dietary attributes and allergens are real data (`Dish.dietary`, `Dish.allergens`, string arrays keyed by `DIETARY_OPTIONS`/`ALLERGEN_OPTIONS` in `lib/menu.ts`) — never infer them from dish names; `Restaurant.dietaryOptions` is the subset a restaurant offers (Settings → General): the dish forms offer only those, the actions keep a dish within them, and the public menu shows only those

### State Management
- Server state via server actions and database
- Client state via React hooks
- Form state via React Hook Form
- Theme state via next-themes

## Testing & Quality

- `pnpm test`: Vitest, colocated `*.test.ts`, the `lib/**` and `server/**` coverage floors pinned in `vitest.config.ts` (raised with the measurement, never lowered; `docs/TESTING.md`).
- `pnpm test:integration`: `tests/integration/**` on a real Postgres in rolled-back transactions (the ORM is not mocked); `pnpm e2e`: Playwright + axe on the production build.
- `pnpm run gate:fast` before a push (the pre-push hook runs it); `pnpm run standards` is the ratchet.

## Vercel Build Compatibility
- All code contributions must be Vercel-compatible. This means:
- The project must successfully build on Vercel using pnpm build.
- All code must pass ESLint checks using pnpm lint.
- All code must pass TypeScript checks using pnpm type-check.
- Avoid using unsupported Node.js APIs or non-standard features not compatible with Vercel's Edge and Serverless environments.
- Dynamic code generation, file system operations, or fs access should be limited to supported use cases.
- Claude-generated code must adhere strictly to these constraints to avoid failed deployments.