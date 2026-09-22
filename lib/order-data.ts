// lib/order-data.ts
// One reading of an order for every screen that shows one. The board polls it, the history page
// reads it directly, and both need the same columns and the same plain shape: Prisma's Decimal
// becomes an exact decimal string and its Dates become ISO strings, because a client component
// receives JSON, not a row.
import type { Prisma } from '@/generated/prisma/client'
import type { BoardOrder } from '@/lib/orders'

/** The columns an order is shown by: its own, plus each line with what the guest asked for. */
export const boardOrderSelect = {
  id: true,
  number: true,
  table: true,
  phone: true,
  note: true,
  status: true,
  subtotal: true,
  createdAt: true,
  updatedAt: true,
  acceptedAt: true,
  servedAt: true,
  placedBy: { select: { email: true } },
  lines: { select: { id: true, nameEn: true, nameFr: true, quantity: true, note: true } },
} satisfies Prisma.OrderSelect

type OrderRow = Prisma.OrderGetPayload<{ select: typeof boardOrderSelect }>

/** A row read with `boardOrderSelect`, as the board and the history render it. */
export function serializeOrder(row: OrderRow): BoardOrder {
  return {
    ...row,
    subtotal: row.subtotal.toFixed(2),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    servedAt: row.servedAt?.toISOString() ?? null,
  }
}
