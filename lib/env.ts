// lib/env.ts
// The one module that reads process.env (VALID.3; the ratchet's `valid.rawEnv` is hard at zero
// elsewhere). Two surfaces: `publicEnv`, client-safe, whose NEXT_PUBLIC_* reads stay literal so
// Next can inline them into the browser bundle; `serverEnv`, parsed by zod on its first read on
// the server. The module is shared with the client bundle, where the server variables do not
// exist, so that parse is lazy rather than at import; on the server the first read is
// lib/prisma.ts creating its client, which is boot.
import { z } from 'zod'

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

// An empty variable (`KEY=` in an env file, a CI matrix) is an unset one.
const unset = (v: unknown) => (v === '' ? undefined : v)
const optional = z.preprocess(unset, z.string().optional())

// What the server needs, and no more. A value is required only where the app cannot run without
// it; the mail pair is all-or-nothing because a key without a sender fails at the first send.
const serverSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    RESEND_API_KEY: optional,
    RESEND_FROM: optional,
    NEXTAUTH_URL: optional,
    NEXT_PUBLIC_APP_URL: optional,
    CLOUDINARY_CLOUD_NAME: optional,
    CLOUDINARY_API_KEY: optional,
    CLOUDINARY_API_SECRET: optional,
    NODE_ENV: z.preprocess(unset, z.enum(['development', 'test', 'production']).default('development')),
  })
  .refine((e) => Boolean(e.RESEND_API_KEY) === Boolean(e.RESEND_FROM), {
    message: 'RESEND_API_KEY and RESEND_FROM are set together or not at all',
  })
  .refine((e) => [e.CLOUDINARY_CLOUD_NAME, e.CLOUDINARY_API_KEY, e.CLOUDINARY_API_SECRET].every(Boolean) === Boolean(e.CLOUDINARY_CLOUD_NAME), {
    message: 'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are set together or not at all',
  })

let parsed: z.infer<typeof serverSchema> | undefined
const server = () => (parsed ??= serverSchema.parse(process.env))

/**
 * Server-only values. Reading one in the browser throws (the schema's required variables are
 * absent there), which is the right failure: nothing secret is reachable through this object.
 */
export const serverEnv = {
  get databaseUrl() {
    return server().DATABASE_URL
  },
  /** Both or neither: with no key, mail is not sent (lib/mail.ts says so to its caller). */
  get resendApiKey() {
    return server().RESEND_API_KEY
  },
  get resendFrom() {
    return server().RESEND_FROM
  },
  /**
   * Origin of the dashboards, for links in transactional mail: NEXTAUTH_URL, else the public
   * origin when one is set explicitly. Never the production literal: a preview deploy that set
   * neither would otherwise mail links to production, so the send fails instead (VALID.4).
   */
  get authUrl() {
    const url = server().NEXTAUTH_URL ?? server().NEXT_PUBLIC_APP_URL
    if (!url) throw new Error('NEXTAUTH_URL (or NEXT_PUBLIC_APP_URL) is not set; no origin for the link')
    return url
  },
  /** Signed server-side uploads (AR assets, logos, covers); all three or none. */
  get cloudinary() {
    const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = server()
    return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null
  },
  get isDevelopment() {
    return server().NODE_ENV === 'development'
  },
}
