import { afterEach, describe, expect, it, vi } from 'vitest'

// publicEnv reads process.env at import and serverEnv on its first getter read, so each case stubs
// the variables before importing a fresh copy and before touching a getter.
async function load(vars: Record<string, string | undefined>) {
  vi.resetModules()
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) vi.stubEnv(k, '')
    else vi.stubEnv(k, v)
  }
  return import('./env')
}

describe('publicEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('versions the service worker by the Vercel commit, shortened to eight characters', async () => {
    const { publicEnv } = await load({ NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: 'abcdef0123456789', NEXT_PUBLIC_BUILD_ID: 'ignored' })
    expect(publicEnv.buildId).toBe('abcdef01')
  })

  it('falls back to the build id, then to "dev"', async () => {
    expect((await load({ NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: '', NEXT_PUBLIC_BUILD_ID: 'b42' })).publicEnv.buildId).toBe('b42')
    expect((await load({ NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: '', NEXT_PUBLIC_BUILD_ID: '' })).publicEnv.buildId).toBe('dev')
  })

  it('uses the production origin when no public app URL is set', async () => {
    expect((await load({ NEXT_PUBLIC_APP_URL: '' })).publicEnv.appUrl).toBe('https://foodify.app')
    expect((await load({ NEXT_PUBLIC_APP_URL: 'https://menu.example' })).publicEnv.appUrl).toBe('https://menu.example')
  })

  it('reports production only for NODE_ENV=production', async () => {
    expect((await load({ NODE_ENV: 'production' })).publicEnv.isProduction).toBe(true)
    expect((await load({ NODE_ENV: 'test' })).publicEnv.isProduction).toBe(false)
  })
})

describe('serverEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('carries the database URL for the Prisma adapter', async () => {
    expect((await load({ DATABASE_URL: 'postgresql://u:p@h/db' })).serverEnv.databaseUrl).toBe('postgresql://u:p@h/db')
  })

  it('refuses to start without a database URL, on the first read', async () => {
    const { serverEnv } = await load({ DATABASE_URL: '' })
    expect(() => serverEnv.databaseUrl).toThrow(/DATABASE_URL/)
  })

  it('refuses a mail key without a sender, and a sender without a key', async () => {
    const half = await load({ DATABASE_URL: 'postgresql://x', RESEND_API_KEY: 're_1', RESEND_FROM: '' })
    expect(() => half.serverEnv.resendApiKey).toThrow(/RESEND_API_KEY and RESEND_FROM/)
    const other = await load({ DATABASE_URL: 'postgresql://x', RESEND_API_KEY: '', RESEND_FROM: 'a@b.c' })
    expect(() => other.serverEnv.resendFrom).toThrow(/RESEND_API_KEY and RESEND_FROM/)
  })

  it('links transactional mail to the auth origin, else to an explicit public origin, never to a literal', async () => {
    expect((await load({ DATABASE_URL: 'postgresql://x', NEXTAUTH_URL: 'https://admin.example' })).serverEnv.authUrl).toBe('https://admin.example')
    expect((await load({ DATABASE_URL: 'postgresql://x', NEXTAUTH_URL: '', NEXT_PUBLIC_APP_URL: 'https://menu.example' })).serverEnv.authUrl).toBe('https://menu.example')
    const neither = await load({ DATABASE_URL: 'postgresql://x', NEXTAUTH_URL: '', NEXT_PUBLIC_APP_URL: '' })
    expect(() => neither.serverEnv.authUrl).toThrow(/NEXTAUTH_URL/)
  })

  it('gives the Cloudinary trio as one value, or nothing, and refuses a partial set', async () => {
    const all = await load({ DATABASE_URL: 'postgresql://x', CLOUDINARY_CLOUD_NAME: 'c', CLOUDINARY_API_KEY: 'k', CLOUDINARY_API_SECRET: 's' })
    expect(all.serverEnv.cloudinary).toEqual({ cloudName: 'c', apiKey: 'k', apiSecret: 's' })
    const none = await load({ DATABASE_URL: 'postgresql://x', CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '' })
    expect(none.serverEnv.cloudinary).toBeNull()
    const partial = await load({ DATABASE_URL: 'postgresql://x', CLOUDINARY_CLOUD_NAME: 'c', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '' })
    expect(() => partial.serverEnv.cloudinary).toThrow(/CLOUDINARY/)
  })

  it('gives the Web Push trio as one value, or nothing, and refuses any partial set', async () => {
    const vapid = { NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'BPub', VAPID_PRIVATE_KEY: 'priv', VAPID_SUBJECT: 'mailto:ops@example.com' }
    const all = await load({ DATABASE_URL: 'postgresql://x', ...vapid })
    expect(all.serverEnv.webPush).toEqual({ publicKey: 'BPub', privateKey: 'priv', subject: 'mailto:ops@example.com' })
    expect(all.publicEnv.vapidPublicKey).toBe('BPub')
    const none = await load({ DATABASE_URL: 'postgresql://x', NEXT_PUBLIC_VAPID_PUBLIC_KEY: '', VAPID_PRIVATE_KEY: '', VAPID_SUBJECT: '' })
    expect(none.serverEnv.webPush).toBeNull()
    expect(none.publicEnv.vapidPublicKey).toBeUndefined()
    // Each one missing on its own, including the private key, which is the one a deploy forgets.
    for (const missing of Object.keys(vapid)) {
      const partial = await load({ DATABASE_URL: 'postgresql://x', ...vapid, [missing]: '' })
      expect(() => partial.serverEnv.webPush, missing).toThrow(/VAPID/)
    }
  })

  it('takes a mailto: or https subject for the push services, nothing else', async () => {
    const vapid = { NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'BPub', VAPID_PRIVATE_KEY: 'priv' }
    expect((await load({ DATABASE_URL: 'postgresql://x', ...vapid, VAPID_SUBJECT: 'https://foodify.app' })).serverEnv.webPush?.subject).toBe('https://foodify.app')
    const plain = await load({ DATABASE_URL: 'postgresql://x', ...vapid, VAPID_SUBJECT: 'ops@example.com' })
    expect(() => plain.serverEnv.webPush).toThrow(/VAPID_SUBJECT/)
  })

  it('reads NODE_ENV once: development only when it says so', async () => {
    expect((await load({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'development' })).serverEnv.isDevelopment).toBe(true)
    expect((await load({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })).serverEnv.isDevelopment).toBe(false)
  })
})
