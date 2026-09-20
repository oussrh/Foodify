import { authenticator } from 'otplib'
import { timingSafeEqual } from 'crypto'

export function verifyTOTP(token: string, secret: string) {
  try {
    return authenticator.check(token, secret)
  } catch {
    return false
  }
}

/** Constant-time string comparison for one-time codes and tokens. */
export function safeEqual(a: string | null | undefined, b: string | null | undefined) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}
