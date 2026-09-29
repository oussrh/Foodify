// server/secret.ts
// Comparing a secret a caller presented with the one configured, in constant time, so the time an
// answer takes says nothing about how much of the guess was right.
import { timingSafeEqual } from 'node:crypto'

/** Whether two secrets are the same, compared in constant time (a bearer token against the configured one). */
export function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
