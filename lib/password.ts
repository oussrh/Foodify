// lib/password.ts
// A temporary password an admin can hand to a new manager: long, random, and easy to copy by hand.
// Random from the platform's cryptographic source (`crypto.getRandomValues`, in the browser and in
// Node alike), never `Math.random`. The characters a reader confuses — 0/O, 1/l/I — are left out,
// because this password is read off a screen or out loud before its owner changes it.

const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnpqrstuvwxyz'
const DIGITS = '23456789'
const SYMBOLS = '!#$%*+-=?@'
const ALL = UPPER + LOWER + DIGITS + SYMBOLS
/** One from each, in this order, before the rest are drawn from ALL. */
const REQUIRED = [UPPER, LOWER, DIGITS, SYMBOLS]

/** How long a generated password is: well past any rule here, and still one line to read out. */
export const GENERATED_LENGTH = 14

/** Fills `out` with random 32-bit values; the platform's by default, a fixed one in tests. */
type RandomSource = (out: Uint32Array) => Uint32Array

const platformRandom: RandomSource = (out) => globalThis.crypto.getRandomValues(out)

/**
 * A random password of `length` characters with at least one capital, one small letter, one digit
 * and one symbol — the classes the account's own password rule asks for — in random positions.
 * The tiny bias of taking a 32-bit value modulo a short alphabet is far below anything guessable.
 */
export function generatePassword(length: number = GENERATED_LENGTH, random: RandomSource = platformRandom): string {
  const size = Math.max(length, 4)
  const values = Array.from(random(new Uint32Array(size * 2)))
  const chars = values.slice(0, size).map((value, i) => {
    const alphabet = REQUIRED[i] ?? ALL
    return alphabet.charAt(value % alphabet.length)
  })
  // Drawn out of the pile in the order the second half of the values gives, so the four required
  // classes are not always first: each draw takes one of those left, a uniform shuffle.
  const shuffled: string[] = []
  for (const value of values.slice(size)) shuffled.push(...chars.splice(value % chars.length, 1))
  return shuffled.join('')
}
