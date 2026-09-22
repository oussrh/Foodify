// lib/restaurant-code.ts
// The short name a restaurant goes by in a link. A uuid is thirty-six characters of noise, and
// the links that matter here are read off a screen and typed into a tablet or a phone by somebody
// standing up — `/waiter/K7M2QX` is a different proposition from
// `/waiter/54d3dcf7-5297-4b2e-99ac-ae4197735f29`.
//
// It is a second identifier, not a replacement: the row keeps its uuid, and nothing joins on the
// code. It is also not the slug. A slug follows the restaurant's name and changes when somebody
// renames it, which would break the tab left open on the pass halfway through a service; a code
// is assigned once and never moves.

/**
 * Crockford's alphabet: digits and capitals with I, L, O and U removed. The first three are
 * removed because they are read as 1 and 0 by anyone typing from a screen, and U because it turns
 * random strings into words nobody wants printed on a menu.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** How long a code is. 32^6 is a little over a billion: collisions are rare and the unique index catches the rest. */
export const CODE_LENGTH = 6

/** A code as it is stored and shown: upper case, no separators. */
const SHAPE = new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`)

/**
 * A new code from a source of randomness. The caller retries on a unique-constraint violation
 * rather than checking first, because checking first is a race and the index is not.
 */
export function newRestaurantCode(random: () => number = Math.random): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[Math.floor(random() * ALPHABET.length)] ?? '0'
  }
  return code
}

/** Whether a string is a code. Used to tell a code from a uuid in a route, so both keep working. */
export function isRestaurantCode(value: string): boolean {
  return SHAPE.test(value)
}

/**
 * A code as somebody typed it: trimmed, upper-cased, and with the characters the alphabet leaves
 * out folded onto the ones they are mistaken for — an I or an l becomes 1, an O becomes 0.
 * Anything still outside the alphabet is not a code, and the caller gets null rather than a guess.
 */
export function parseRestaurantCode(value: string): string | null {
  const folded = value
    .trim()
    .toUpperCase()
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0')
    .replace(/U/g, 'V')
  return isRestaurantCode(folded) ? folded : null
}
