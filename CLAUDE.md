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
- NextAuth v5 with credentials + email OTP/TOTP 2FA
- Role-based access control in `lib/auth-guard.ts` (`requireSuperAdmin`, `requireRestaurantAccess`, dish/category variants); `proxy.ts` (Next 16's name for middleware) only rewrites subdomains
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
- `components/menu/` — customer-facing menu (`restaurant-page.tsx`, `dish-row.tsx`, `dish-body.tsx`, `dish-page.tsx`, `menu-footer.tsx`, `ar-launch-button.tsx`). Types, dietary/allergen vocab and UI strings live in `lib/menu.ts`; Prisma → plain serializers in `lib/menu-data.ts`.
- `components/auth/sign-in-flow.tsx` — the single two-step (password → emailed code) sign-in used by all admin/manager auth routes.
- Public menu PWA/SEO: `public/sw.js` (versioned by `?v=<build>`, registered by `components/menu/use-pwa.ts` in production only; scoped to `/restaurant/*`, Next static, images, fonts; the page posts a `PRECACHE` list so a visited menu works fully offline; new versions wait until the guest taps Refresh — never call `skipWaiting()` on install), `/offline` fallback page, per-restaurant manifest at `app/restaurant/[slug]/manifest/route.ts`, icons in `public/icons/`, JSON-LD from `lib/structured-data.ts`, route `loading`/`error`/`not-found` states. Guest language: `?lang=`, then `localStorage` (`LOCALE_STORAGE_KEY`), then browser, then restaurant default; prices via `formatPrice(price, Money)`.
- Feature forms (`create-*-form.tsx`, `edit-*-form.tsx`, category managers, uploads) are shared by both roles.

### Design system ("Quiet Plate")
- Tokens in `app/globals.css` (Tailwind 4: the `@theme` block maps them to utilities; there is no `tailwind.config.ts`); warm neutral ground, one accent "Basil", light + dark; radius encodes hierarchy (`rounded-sm` controls, `rounded-lg` cards, `rounded-sheet` sheets); shadows only on floating layers (`shadow-sheet`, `shadow-popover`).
- Font is Instrument Sans via `next/font` (`--font-sans`). Do not reintroduce Tailwind colour utilities (`bg-blue-500`, `text-gray-600`…) or gradients on chrome; use `primary`, `muted`, `success`, `warning`, `destructive`.
- Restaurant brand colours are never painted raw under text: `lib/brand-color.ts` derives a contrast-safe ink + tint, exposed as `text-brand`, `bg-brand`, `bg-brand-tint`, `text-brand-on` inside a `.brand-scope` element.
- `components/branding/` is the Settings → Branding tab: live phone preview (`menu-preview.tsx`), logo/cover tiles (`image-tile.tsx`, uploads persist immediately via `lib/brand-upload.ts`), colour presets + contrast readout, font picker (`lib/brand-fonts.ts`), and `Restaurant.menuTheme` (system | light | dark). A forced theme is applied as a `.light`/`.dark` class on the `.brand-scope` wrapper; `globals.css` defines both scopes.

### Server Actions Pattern
All data mutations use Next.js server actions in `app/actions/`:
- `dish-actions.ts` - CRUD operations for dishes
- `restaurant-actions.ts` - Restaurant management
- `admin-auth-actions.ts` - Admin authentication flows
- Actions handle file uploads, database operations, and validation
- Every export of a `'use server'` file is a public POST endpoint: the first line of each one is a guard from `lib/auth-guard.ts` (see `docs/LESSONS.md`), the next a zod parse of its arguments with a schema from `lib/schemas/` that the form validates with too (the ratchet's `valid.unparsedBoundary` is hard at zero). Unused exports are deleted, not kept "for later" — `knip` fails the gate on them.

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
- `Restaurant.openingHours` is JSON (`lib/opening-hours.ts`: per-day periods + note; legacy free text is kept as the note) and `socialMedia` is JSON `{instagram, facebook, twitter}` (`lib/social-media.ts` still accepts URLs/free text). Edit them through `components/contact/` — never as raw strings.
- Dietary attributes and allergens are real data (`Dish.dietary`, `Dish.allergens`, string arrays keyed by `DIETARY_OPTIONS`/`ALLERGEN_OPTIONS` in `lib/menu.ts`) — never infer them from dish names

### State Management
- Server state via server actions and database
- Client state via React hooks
- Form state via React Hook Form
- Theme state via next-themes

## Testing & Quality

Currently no test framework is configured. When adding tests, use the project's existing patterns and ensure compatibility with:
- TypeScript configuration
- Prisma database schema
- NextAuth session handling

## Vercel Build Compatibility
- All code contributions must be Vercel-compatible. This means:
- The project must successfully build on Vercel using pnpm build.
- All code must pass ESLint checks using pnpm lint.
- All code must pass TypeScript checks using pnpm type-check.
- Avoid using unsupported Node.js APIs or non-standard features not compatible with Vercel's Edge and Serverless environments.
- Dynamic code generation, file system operations, or fs access should be limited to supported use cases.
- Claude-generated code must adhere strictly to these constraints to avoid failed deployments.