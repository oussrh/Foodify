// server/print/token.ts
// The secret a printer names itself by: part of the address its owner types into it, so it is
// long and random, shown once and never stored. The table keeps its SHA-256, which is what a poll
// is looked up by; a leaked database therefore hands nobody a working printer address.
import { createHash, randomBytes } from 'node:crypto'

/** The SHA-256 of `token`, hex: what `Printer.tokenHash` holds. */
export function hashPrinterToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** A new secret for a printer (32 URL-safe characters, 192 bits) and its hash. */
export function newPrinterToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString('base64url')
  return { token, hash: hashPrinterToken(token) }
}
