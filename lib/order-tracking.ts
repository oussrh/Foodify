// lib/order-tracking.ts
// One reading of an order for the guest who placed it (GET /api/orders/track/<secret>): the
// columns the guest may see and their plain shape. What the kitchen and the floor know about the
// order (the phone, who took it, the notes, the change log and its reasons, the POS) is not
// selected at all, so it cannot leak by a later spread. The table and the subtotal are the row's
// own, which a move to another table or a dish taken off keeps current (server/bill-changes.ts,
// server/ticket-apply.ts); a merge only re-points `parentId`, which the guest does not see.
import type { Prisma } from '@/generated/prisma/client'
import { effectiveQuantity } from '@/lib/orders'
import type { TrackedOrder } from '@/lib/schemas/order-tracking'

/** The columns a tracked order is read with. */
export const trackedOrderSelect = {
  number: true,
  table: true,
  status: true,
  subtotal: true,
  currency: true,
  createdAt: true,
  acceptedAt: true,
  readyAt: true,
  servedAt: true,
  lines: { select: { nameEn: true, nameFr: true, quantity: true, removedQuantity: true } },
  restaurant: { select: { slug: true, name: true } },
} satisfies Prisma.OrderSelect

type TrackedRow = Prisma.OrderGetPayload<{ select: typeof trackedOrderSelect }>

/**
 * A row read with `trackedOrderSelect`, as the guest sees it: each line at the quantity still
 * coming, a line taken off whole left out, the money an exact decimal string and the moments ISO.
 */
export function serializeTrackedOrder(row: TrackedRow): TrackedOrder {
  const iso = (date: Date | null) => date?.toISOString() ?? null
  return {
    number: row.number,
    table: row.table,
    status: row.status,
    lines: row.lines
      .map((line) => ({ nameEn: line.nameEn, nameFr: line.nameFr, quantity: effectiveQuantity(line) }))
      .filter((line) => line.quantity > 0),
    subtotal: row.subtotal.toFixed(2),
    currency: row.currency,
    createdAt: row.createdAt.toISOString(),
    acceptedAt: iso(row.acceptedAt),
    readyAt: iso(row.readyAt),
    servedAt: iso(row.servedAt),
    restaurant: row.restaurant,
  }
}
