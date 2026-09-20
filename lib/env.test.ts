import { afterEach, describe, expect, it, vi } from 'vitest'

// The module reads process.env once at import, so each case stubs the variables and imports a fresh copy.
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

  it('links transactional mail to the auth origin, and to the public origin when none is set', async () => {
    expect((await load({ DATABASE_URL: 'postgresql://x', NEXTAUTH_URL: 'https://admin.example' })).serverEnv.authUrl).toBe('https://admin.example')
    expect((await load({ DATABASE_URL: 'postgresql://x', NEXTAUTH_URL: '', NEXT_PUBLIC_APP_URL: 'https://menu.example' })).serverEnv.authUrl).toBe('https://menu.example')
  })

  it('reads NODE_ENV once: development only when it says so', async () => {
    expect((await load({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'development' })).serverEnv.isDevelopment).toBe(true)
    expect((await load({ DATABASE_URL: 'postgresql://x', NODE_ENV: 'test' })).serverEnv.isDevelopment).toBe(false)
  })
})
