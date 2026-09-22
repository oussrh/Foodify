// lib/cart.ts
// The guest's order in the making, one per restaurant on the device: the dishes picked with
// their quantities and the table it is for. Pure functions over the record, and the
// localStorage read and write the menu's cart store (components/menu/cart) goes through. What
// is stored is ids, counts and what the guest asked for: names and prices come from the menu on
// every render, and the server re-prices everything when the order is sent (app/api/orders).

/** One dish in the order, how many of it, and what the guest asked for on it ("no onions"). */
export interface CartLine {
  dishId: string
  quantity: number
  /** One note per dish rather than per portion; absent when the guest asked for nothing. */
  note?: string
}

/** The order in the making: its lines and the table number the guest gave (or the QR link carried). */
export interface Cart {
  lines: CartLine[]
  table: string
}

/** No more of one dish than this; the stepper stops here and the API refuses beyond it. */
export const MAX_QUANTITY = 20
/** No more distinct dishes than this in one order; the API refuses beyond it. */
export const MAX_LINES = 50
/** How long a line's note may be; the field stops here and the API refuses beyond it. */
export const MAX_NOTE = 140
/** The localStorage key of a restaurant's cart: one per restaurant, on the origin. */
export const cartStorageKey = (restaurantId: string) => `foodify-cart:${restaurantId}`

/** The cart with nothing in it. */
export const EMPTY_CART: Cart = { lines: [], table: '' }

/** How many of `dishId` the cart holds; 0 when none. */
export function quantityOf(cart: Cart, dishId: string): number {
  return cart.lines.find((l) => l.dishId === dishId)?.quantity ?? 0
}

/** What the guest asked for on `dishId`; '' when nothing, or when the dish is not in the cart. */
export function noteOf(cart: Cart, dishId: string): string {
  return cart.lines.find((l) => l.dishId === dishId)?.note ?? ''
}

/** The number of items over every line. */
export function cartCount(cart: Cart): number {
  return cart.lines.reduce((n, l) => n + l.quantity, 0)
}

/**
 * The cart with `dishId` at `quantity`: 0 (or less) removes the line and its note, more than
 * MAX_QUANTITY is clamped, a change keeps the note, and a new dish is appended unless the cart
 * already has MAX_LINES dishes (then it is left as is).
 */
export function withQuantity(cart: Cart, dishId: string, quantity: number): Cart {
  const clamped = Math.min(Math.max(Math.trunc(quantity), 0), MAX_QUANTITY)
  const present = cart.lines.some((l) => l.dishId === dishId)
  if (clamped === 0) return present ? { ...cart, lines: cart.lines.filter((l) => l.dishId !== dishId) } : cart
  if (present) return { ...cart, lines: cart.lines.map((l) => (l.dishId === dishId ? { ...l, quantity: clamped } : l)) }
  if (cart.lines.length >= MAX_LINES) return cart
  return { ...cart, lines: [...cart.lines, { dishId, quantity: clamped }] }
}

/**
 * The cart with `dishId`'s note set. The note is stored as it is typed (capped at MAX_NOTE), so
 * a space the guest types stays until the next letter; only a note that is nothing but spaces is
 * dropped, and the trimming happens where the note leaves: `cartLinesToSend` and `orderLineNote`.
 * A dish that is not in the cart is left out of it (a note alone never adds a dish).
 */
export function withNote(cart: Cart, dishId: string, note: string): Cart {
  if (!cart.lines.some((l) => l.dishId === dishId)) return cart
  const kept = note.trim() ? note.slice(0, MAX_NOTE) : ''
  return {
    ...cart,
    lines: cart.lines.map((line) => {
      if (line.dishId !== dishId) return line
      // A blank note leaves no key behind: a stored line is either noted or plain.
      return kept ? { dishId: line.dishId, quantity: line.quantity, note: kept } : { dishId: line.dishId, quantity: line.quantity }
    }),
  }
}

/** A stored value as a Cart, or the empty cart for anything that is not one (another version, a hand edit). */
export function parseCart(raw: string | null): Cart {
  if (!raw) return EMPTY_CART
  try {
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null || !Array.isArray((value as { lines?: unknown }).lines)) return EMPTY_CART
    const { lines, table } = value as { lines: unknown[]; table?: unknown }
    const clean = lines
      .filter((l): l is CartLine => typeof l === 'object' && l !== null && typeof (l as CartLine).dishId === 'string' && Number.isInteger((l as CartLine).quantity))
      .map((l) => {
        const quantity = Math.min(Math.max(l.quantity, 1), MAX_QUANTITY)
        const note = typeof l.note === 'string' ? l.note.trim().slice(0, MAX_NOTE) : ''
        return note ? { dishId: l.dishId, quantity, note } : { dishId: l.dishId, quantity }
      })
      .slice(0, MAX_LINES)
    return { lines: clean, table: typeof table === 'string' ? table : '' }
  } catch {
    return EMPTY_CART
  }
}

/** The restaurant's cart from localStorage; the empty cart when storage is unavailable or holds nothing usable. */
export function readCart(restaurantId: string): Cart {
  try {
    return parseCart(window.localStorage.getItem(cartStorageKey(restaurantId)))
  } catch {
    return EMPTY_CART
  }
}

/** Stores the cart, or removes the key for an empty one; a storage failure (private mode, quota) is ignored. */
export function writeCart(restaurantId: string, cart: Cart): void {
  try {
    const key = cartStorageKey(restaurantId)
    if (cart.lines.length === 0 && !cart.table) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(cart))
  } catch {
    // storage unavailable
  }
}
