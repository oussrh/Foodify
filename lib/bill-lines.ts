// lib/bill-lines.ts
// What a ticket comes to once dishes have been taken off it. Nothing is deleted: a line keeps
// the quantity that was ordered and counts what was removed beside it, so the kitchen still reads
// "−1 Tea" and the record still says what was asked for. What the guest pays and what the kitchen
// makes is the difference, and the subtotal is recomputed from it on integers (lib/money.ts).
// Client-safe.
import { sumPrices } from '@/lib/money'
import { effectiveQuantity, type OrderStatus } from '@/lib/orders'

/** One line as a subtotal is worked out from: its unit price (an exact decimal string) and its quantities. */
export type PricedQuantities = { unitPrice: string; quantity: number; removedQuantity: number }

/** What a ticket's lines come to, net of what was taken off: an exact two-decimal string. */
export function ticketSubtotal(lines: readonly PricedQuantities[]): string {
  return sumPrices(lines.map((line) => ({ price: line.unitPrice, quantity: effectiveQuantity(line) })))
}

/**
 * The line's `removedQuantity` after taking `quantity` more off it, or 'too_many' when that is
 * more than is left on it, or 'nothing_left' when nothing is. `quantity` is a whole number from 1.
 */
export function removeFrom(line: { quantity: number; removedQuantity: number }, quantity: number): number | 'too_many' | 'nothing_left' {
  const left = effectiveQuantity(line)
  if (left === 0) return 'nothing_left'
  if (quantity > left) return 'too_many'
  return line.removedQuantity + quantity
}

/** Whether every line of a ticket has been taken off whole: such a ticket is a cancelled one. */
export function allRemoved(lines: readonly { quantity: number; removedQuantity: number }[]): boolean {
  return lines.every((line) => effectiveQuantity(line) === 0)
}

/** The statuses a ticket is still with the kitchen or on the pass in: not served, not cancelled. */
const IN_KITCHEN: readonly OrderStatus[] = ['NEW', 'ACCEPTED', 'READY']

/**
 * How many dishes of a bill are still with the kitchen or on the pass: the portions left on every
 * ticket that is not yet served or cancelled. Closing a bill while this is above zero is a
 * question the waiter answers ("N dishes still in the kitchen. Close anyway?"), not a refusal.
 */
export function dishesInKitchen(tickets: readonly { status: OrderStatus; lines: readonly { quantity: number; removedQuantity: number }[] }[]): number {
  return tickets
    .filter((ticket) => IN_KITCHEN.includes(ticket.status))
    .reduce((sum, ticket) => sum + ticket.lines.reduce((n, line) => n + effectiveQuantity(line), 0), 0)
}
