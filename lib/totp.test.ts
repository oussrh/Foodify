import { generateSync } from 'otplib'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { safeEqual, verifyTOTP } from './totp'

describe('safeEqual', () => {
  it('is true only for two identical strings', () => {
    expect(safeEqual('123456', '123456')).toBe(true)
    expect(safeEqual('123456', '123457')).toBe(false)
  })

  it('is false when the lengths differ, without throwing', () => {
    expect(safeEqual('1234', '123456')).toBe(false)
  })

  it('is false when either side is missing', () => {
    expect(safeEqual(null, 'x')).toBe(false)
    expect(safeEqual('x', undefined)).toBe(false)
    expect(safeEqual(undefined, undefined)).toBe(false)
  })
})

describe('verifyTOTP', () => {
  // 20-byte secrets, as generateSecret() issues them; otplib 13 refuses anything under 16 bytes.
  const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('accepts the code generated for the same secret at the same time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-20T10:00:00Z'))
    expect(verifyTOTP(generateSync({ secret }), secret)).toBe(true)
  })

  it('rejects a code from another secret', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-20T10:00:00Z'))
    expect(verifyTOTP(generateSync({ secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ' }), secret)).toBe(false)
  })

  it('is false for an empty or malformed code', () => {
    expect(verifyTOTP('', '')).toBe(false)
    expect(verifyTOTP('abc', 'not-base32!!')).toBe(false)
  })

  it('returns false instead of propagating an error from the library (a secret under 16 bytes throws)', () => {
    expect(verifyTOTP('123456', 'JBSWY3DPEHPK3PXP')).toBe(false)
  })
})
