import { afterEach, describe, expect, it, vi } from 'vitest'
import { openWith, PosCryptoError, sealWith } from './pos-crypto'

const key = { key: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=', keyId: 'k1' }
const otherKey = { key: 'ZmVkY2JhOTg3NjU0MzIxMGZlZGNiYTk4NzY1NDMyMTA=', keyId: 'k1' }
const credentials = { apiKey: 'test_secret_key' }

describe('sealing POS credentials', () => {
  it('opens what it sealed, under the same key and restaurant', () => {
    const sealed = sealWith(key, credentials, 'restaurant-1')
    expect(sealed.keyId).toBe('k1')
    expect(sealed.credentials).not.toContain('test_secret_key')
    expect(openWith(key, sealed, 'restaurant-1')).toEqual(credentials)
  })

  it('seals the same credentials differently every time (a fresh IV)', () => {
    expect(sealWith(key, credentials, 'r').credentials).not.toBe(sealWith(key, credentials, 'r').credentials)
  })

  it('refuses a value altered by one character', () => {
    const sealed = sealWith(key, credentials, 'restaurant-1')
    const [format, iv, tag, body] = sealed.credentials.split('.')
    const flipped = `${body?.startsWith('A') ? 'B' : 'A'}${body?.slice(1)}`
    expect(() => openWith(key, { ...sealed, credentials: [format, iv, tag, flipped].join('.') }, 'restaurant-1')).toThrow(PosCryptoError)
  })

  it('refuses a tag cut short, even one GCM would accept', () => {
    const sealed = sealWith(key, credentials, 'restaurant-1')
    const [format, iv, tag, body] = sealed.credentials.split('.')
    const short = Buffer.from(tag ?? '', 'base64').subarray(0, 12).toString('base64')
    expect(() => openWith(key, { ...sealed, credentials: [format, iv, short, body].join('.') }, 'restaurant-1')).toThrow(/not in a form/)
  })

  it('refuses the wrong key, and a value copied onto another restaurant', () => {
    const sealed = sealWith(key, credentials, 'restaurant-1')
    expect(() => openWith(otherKey, sealed, 'restaurant-1')).toThrow(/cannot be opened/)
    expect(() => openWith(key, sealed, 'restaurant-2')).toThrow(/cannot be opened/)
  })

  it('names a value sealed under another key id rather than calling it tampered', () => {
    const sealed = sealWith(key, credentials, 'r')
    expect(() => openWith({ ...key, keyId: 'k2' }, sealed, 'r')).toThrow('These credentials were sealed under key k1, not k2')
  })

  it('refuses a value that is not in its form', () => {
    expect(() => openWith(key, { credentials: 'plain-text', keyId: 'k1' }, 'r')).toThrow(/not in a form/)
    expect(() => openWith(key, { credentials: 'v0.a.b.c', keyId: 'k1' }, 'r')).toThrow(/not in a form/)
  })
})

describe('sealing with the server key', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('seals and opens with POS_ENCRYPTION_KEY', async () => {
    vi.resetModules()
    vi.stubEnv('DATABASE_URL', 'postgresql://x')
    vi.stubEnv('POS_ENCRYPTION_KEY', key.key)
    vi.stubEnv('POS_ENCRYPTION_KEY_ID', 'k7')
    const crypto = await import('./pos-crypto')
    const sealed = crypto.sealCredentials(credentials, 'r')
    expect(sealed.keyId).toBe('k7')
    expect(crypto.openCredentials(sealed, 'r')).toEqual(credentials)
  })

  it('refuses both with the "not configured" message when the key is unset', async () => {
    vi.resetModules()
    vi.stubEnv('DATABASE_URL', 'postgresql://x')
    vi.stubEnv('POS_ENCRYPTION_KEY', '')
    const crypto = await import('./pos-crypto')
    expect(() => crypto.sealCredentials(credentials, 'r')).toThrow('POS integration is not configured on this server')
    expect(() => crypto.openCredentials({ credentials: 'x', keyId: 'k1' }, 'r')).toThrow('POS integration is not configured on this server')
  })
})
