// lib/env.ts
// The one module that reads process.env (VALID.3; the ratchet's `valid.rawEnv` exempts it).
// Client-safe values only for now: each NEXT_PUBLIC_* access stays a literal
// `process.env.NEXT_PUBLIC_X` so Next can inline it into the browser bundle. Server secrets
// (Resend, NextAuth, Cloudinary API) still read process.env in their own modules; moving them
// here behind a zod parse is phase 4 of docs/GAP_ANALYSIS_2026-09-20.md.

export const publicEnv = {
  /** Unsigned Cloudinary uploads straight from the browser; when unset, uploads go through a server action. */
  cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  /** Build identity that versions the service worker so every deploy ships a fresh worker and cache. */
  buildId: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || process.env.NEXT_PUBLIC_BUILD_ID || 'dev',
  isProduction: process.env.NODE_ENV === 'production',
  /** Public origin of the site, for links sent off-site (JSON-LD, the QR target). */
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://foodify.app',
} as const

/**
 * Server-only values. A client bundle sees `undefined` here: Next inlines NEXT_PUBLIC_* only,
 * so nothing secret reaches the browser through this object.
 */
export const serverEnv = {
  databaseUrl: process.env.DATABASE_URL,
} as const
