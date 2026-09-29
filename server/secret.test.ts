import { describe, expect, it } from 'vitest'
import { hashSecret, newSecret, sameSecret } from './secret'

describe('sameSecret', () => {
  it('is true for the same secret only', () => {
    expect(sameSecret('abc-123', 'abc-123')).toBe(true)
    expect(sameSecret('abc-124', 'abc-123')).toBe(false)
    expect(sameSecret('abc', 'abc-123')).toBe(false)
  })
})

describe('capability secrets', () => {
  it('are 32 URL-safe characters, stored as their SHA-256', () => {
    const { token, hash } = newSecret()
    expect(token).toMatch(/^[A-Za-z0-9_-]{32}$/)
    expect(hash).toBe(hashSecret(token))
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('hash to the known SHA-256', () => {
    // An independent statement of the digest (sha256("abc"), FIPS 180-2), not the code's own.
    expect(hashSecret('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('never repeat', () => {
    expect(newSecret().token).not.toBe(newSecret().token)
  })
})
