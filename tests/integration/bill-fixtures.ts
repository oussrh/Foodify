// tests/integration/bill-fixtures.ts
// A restaurant's floor for the bill suites: a restaurant taking orders on a clock chosen so the
// suite never runs across its 04:00, its waiter, tablet and manager, and tickets built the way a
// waiter's sends leave them (a bill and its additions, with priced lines).
import type { Tx } from './db'
import { kitchenTablet, manager, restaurant, waiter } from './fixtures'

/** Chosen so the wall clock is well away from 04:00 whenever the suite runs: a ticket of ten minutes ago is of today's service. */
export const ZONE = new Date().getUTCHours() < 6 ? 'Asia/Tokyo' : 'UTC'

const MINUTE = 60_000

/** A restaurant taking orders, and the three kinds of staff who act on its bills. Nobody is signed in. */
export async function floor(tx: Tx) {
  const place = await restaurant(tx)
  await tx.restaurant.update({ where: { id: place.id }, data: { orderingEnabled: true, timeZone: ZONE } })
  return { place, waiter: await waiter(tx, [place.id]), kitchen: await kitchenTablet(tx, [place.id]), manager: await manager(tx, [place.id]) }
}

let number = 100

export interface TicketSpec {
  table?: string
  status?: 'NEW' | 'ACCEPTED' | 'READY' | 'DONE' | 'CANCELLED'
  parentId?: string
  minutesAgo?: number
  closedAt?: Date
  /** Each line's dish name, unit price and quantity; one Tea at 2.50 and two Mint at 4.00 by default. */
  lines?: { nameEn: string; unitPrice: string; quantity: number }[]
}

/** A ticket as a send leaves it: numbered, priced, its subtotal the sum of its lines. */
export async function ticket(tx: Tx, restaurantId: string, spec: TicketSpec = {}) {
  const lines = spec.lines ?? [
    { nameEn: 'Tea', unitPrice: '2.50', quantity: 1 },
    { nameEn: 'Mint', unitPrice: '4.00', quantity: 2 },
  ]
  const subtotal = lines.reduce((sum, line) => sum + Math.round(Number(line.unitPrice) * 100) * line.quantity, 0) / 100
  return tx.order.create({
    data: {
      restaurantId,
      number: ++number,
      table: spec.table ?? '4',
      phone: '',
      subtotal: subtotal.toFixed(2),
      status: spec.status ?? 'NEW',
      parentId: spec.parentId ?? null,
      closedAt: spec.closedAt ?? null,
      createdAt: new Date(Date.now() - (spec.minutesAgo ?? 10) * MINUTE),
      lines: { create: lines.map((line) => ({ ...line, nameFr: line.nameEn })) },
    },
    select: { id: true, number: true, lines: { select: { id: true, nameEn: true }, orderBy: { nameEn: 'desc' } } },
  })
}

/** The ticket's status, subtotal and each line's quantities, as they now stand. */
export async function state(tx: Tx, orderId: string) {
  const row = await tx.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { status: true, subtotal: true, table: true, parentId: true, closedAt: true, lines: { select: { nameEn: true, quantity: true, removedQuantity: true }, orderBy: { nameEn: 'desc' } } },
  })
  return { ...row, subtotal: row.subtotal.toFixed(2) }
}

/** The id of the line named `nameEn` on a ticket made by `ticket`; a test that names a line it did not make fails here. */
export function lineOf(sent: { lines: { id: string; nameEn: string }[] }, nameEn: string): string {
  const line = sent.lines.find((candidate) => candidate.nameEn === nameEn)
  if (!line) throw new Error(`no line ${nameEn}`)
  return line.id
}

/** The first of `items`, which the test expects to be there. */
export function first<T>(items: readonly T[]): T {
  const [item] = items
  if (item === undefined) throw new Error('expected at least one')
  return item
}
