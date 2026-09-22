// lib/money.ts
// Arithmetic on the exact two-decimal price strings the menu carries (MenuDish.price, API.1:
// never a float). A price becomes integer minor units, the sum is done on integers, and the
// result is a two-decimal string again for formatPrice. Client-safe.

/** `'12.50'` → 1250. A string that is not a plain decimal with at most two fraction digits is refused. */
export function toMinorUnits(price: string): number {
  const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(price)
  if (!m) throw new Error(`Not a price: ${price}`)
  const whole = Number(m[1])
  const fraction = m[2] ? Number(m[2].padEnd(2, '0')) : 0
  return whole * 100 + fraction
}

/** 1250 → `'12.50'`. */
export function fromMinorUnits(units: number): string {
  const whole = Math.floor(units / 100)
  const fraction = units % 100
  return `${whole}.${String(fraction).padStart(2, '0')}`
}

/** `'12.50'` × 3 → `'37.50'`. */
export function multiplyPrice(price: string, quantity: number): string {
  return fromMinorUnits(toMinorUnits(price) * quantity)
}

/** The sum of `price × quantity` over the lines, as a two-decimal string; `'0.00'` for none. */
export function sumPrices(lines: readonly { price: string; quantity: number }[]): string {
  return fromMinorUnits(lines.reduce((total, line) => total + toMinorUnits(line.price) * line.quantity, 0))
}
