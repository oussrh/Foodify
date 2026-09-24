// lib/order-data.ts
// One reading of an order for every screen that shows one. The board polls it, the history page
// reads it directly, and both need the same columns and the same plain shape: Prisma's Decimal
// becomes an exact decimal string and its Dates become ISO strings, because a client component
// receives JSON, not a row.
import type { Prisma } from '@/generated/prisma/client'
import type { BoardOrder, PendingRequest } from '@/lib/orders'

/** How many open requests one ticket carries at most: one per line and one for the whole ticket (lib/bill-rules.ts), far under this. */
const MAX_REQUESTS = 20

/**
 * The columns an order is shown by: its own, the number of the order it adds to and whether that
 * bill was closed, each line with what the guest asked for and what was taken off it since, and
 * the requests the kitchen has still to answer.
 */
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
  readyAt: true,
  servedAt: true,
  placedBy: { select: { email: true } },
  parentId: true,
  closedAt: true,
  parent: { select: { number: true, closedAt: true } },
  lines: { select: { id: true, nameEn: true, nameFr: true, quantity: true, removedQuantity: true, note: true } },
  changes: {
    where: { status: 'PENDING' },
    select: { id: true, kind: true, lineId: true, quantity: true, reason: true, note: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
    take: MAX_REQUESTS,
  },
} satisfies Prisma.OrderSelect

type OrderRow = Prisma.OrderGetPayload<{ select: typeof boardOrderSelect }>

/** A pending change as the board shows it: only a cancel or a removal is ever asked for. */
function serializeRequest(change: OrderRow['changes'][number]): PendingRequest {
  return {
    id: change.id,
    kind: change.kind === 'CANCEL' ? 'CANCEL' : 'REMOVE',
    lineId: change.lineId,
    quantity: change.quantity,
    reason: change.reason,
    note: change.note,
    createdAt: change.createdAt.toISOString(),
  }
}

/** A row read with `boardOrderSelect`, as the board and the history render it. */
export function serializeOrder(row: OrderRow): BoardOrder {
  const { parent, closedAt, changes, ...rest } = row
  // The bill's own stamp is on the order that opened it; an addition reads its parent's.
  const billClosedAt = parent ? parent.closedAt : closedAt
  return {
    ...rest,
    parentNumber: parent?.number ?? null,
    billClosedAt: billClosedAt?.toISOString() ?? null,
    requests: changes.map(serializeRequest),
    subtotal: row.subtotal.toFixed(2),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    readyAt: row.readyAt?.toISOString() ?? null,
    servedAt: row.servedAt?.toISOString() ?? null,
  }
}
