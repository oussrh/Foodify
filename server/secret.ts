// server/secret.ts
// Secrets a caller presents: comparing one with the configured value in constant time, so the
// time an answer takes says nothing about how much of the guess was right; and the capability
// secrets this server hands out (a printer's address, a guest's order-tracking link), which are
// long and random, shown once and never stored. A table keeps only the SHA-256, which is what a
// call is looked up by, so a leaked database hands nobody a working address.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** Whether two secrets are the same, compared in constant time (a bearer token against the configured one). */
export function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** The SHA-256 of `secret`, hex: what a `…TokenHash` column holds (`Printer.tokenHash`, `Order.guestTokenHash`). */
export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

/** A new capability secret (32 URL-safe characters, 192 bits) and its hash. */
export function newSecret(): { token: string; hash: string } {
  const token = randomBytes(24).toString('base64url')
  return { token, hash: hashSecret(token) }
}
