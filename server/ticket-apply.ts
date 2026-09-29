// server/ticket-apply.ts
// Writing a change to one ticket, once it has been decided that it goes through: the line's
// removed count, the subtotal recomputed from what is left (lib/bill-lines.ts), the ticket
// cancelled when nothing is left on it, and the requests still open on a cancelled ticket
// answered for the kitchen, since there is nothing left for them to change. Called inside a
// transaction that has locked the ticket (server/order-lock.ts). Nothing is deleted.
import type { Prisma } from '@/generated/prisma/client'
import { allRemoved, ticketSubtotal } from '@/lib/bill-lines'
import type { OrderStatus } from '@/lib/orders'

/** The columns of a ticket a change is decided and applied on. */
export const TICKET_SELECT = {
  id: true,
  restaurantId: true,
  number: true,
  table: true,
  status: true,
  subtotal: true,
  closedAt: true,
  parentId: true,
  parent: { select: { closedAt: true } },
  lines: { select: { id: true, nameEn: true, unitPrice: true, quantity: true, removedQuantity: true } },
  changes: { where: { status: 'PENDING' }, select: { id: true, kind: true, lineId: true } },
} satisfies Prisma.OrderSelect

/** A ticket read with TICKET_SELECT. */
export type TicketRow = Prisma.OrderGetPayload<{ select: typeof TICKET_SELECT }>

/** What is taken off: the whole ticket (`lineId` null) or `quantity` of one line; `voided` takes every line off a whole ticket. */
export type Removal = { lineId: string | null; quantity: number | null; voided: boolean }

/** Where the ticket stands after a change: its status and its subtotal, an exact decimal string. */
export type TicketState = { status: OrderStatus; subtotal: string }

/** The removed count each line of `ticket` has once `removal` is applied (a line it does not touch keeps its own). */
function removedCounts(ticket: TicketRow, removal: Removal): Map<string, number> {
  return new Map(
    ticket.lines.map((line) => {
      if (removal.lineId === null) return [line.id, line.quantity]
      if (line.id !== removal.lineId) return [line.id, line.removedQuantity]
      return [line.id, Math.min(line.quantity, line.removedQuantity + (removal.quantity ?? 0))]
    }),
  )
}

/**
 * Applies `removal` to the locked `ticket`. A cancel of the whole ticket is a status and leaves
 * the lines as they were ordered (the kitchen never made it); a removal or a void takes portions
 * off the lines and recomputes the subtotal, and a ticket left with nothing is cancelled.
 */
export async function applyRemoval(tx: Prisma.TransactionClient, ticket: TicketRow, removal: Removal): Promise<TicketState> {
  if (removal.lineId === null && !removal.voided) {
    await tx.order.update({ where: { id: ticket.id }, data: { status: 'CANCELLED' }, select: { id: true } })
    return { status: 'CANCELLED', subtotal: ticketSubtotal(ticket.lines.map((line) => ({ ...line, unitPrice: line.unitPrice.toFixed(2) }))) }
  }
  const counts = removedCounts(ticket, removal)
  const lines = ticket.lines.map((line) => ({ ...line, unitPrice: line.unitPrice.toFixed(2), removedQuantity: counts.get(line.id) ?? line.removedQuantity }))
  for (const line of ticket.lines) {
    const removed = counts.get(line.id)
    if (removed !== undefined && removed !== line.removedQuantity) await tx.orderLine.update({ where: { id: line.id }, data: { removedQuantity: removed }, select: { id: true } })
  }
  const subtotal = ticketSubtotal(lines)
  const status: OrderStatus = allRemoved(lines) ? 'CANCELLED' : ticket.status
  await tx.order.update({ where: { id: ticket.id }, data: { subtotal, status }, select: { id: true } })
  return { status, subtotal }
}

/** Whether the bill a locked ticket belongs to has been closed: its own stamp for a bill, its parent's for an addition. */
export function billClosed(ticket: Pick<TicketRow, 'closedAt' | 'parent'>): boolean {
  return (ticket.parent ? ticket.parent.closedAt : ticket.closedAt) !== null
}

/**
 * Answers every request still open on `orderIds`: refused, by `deciderId` (null: the POS, closing a
 * bill paid at its till), because there is nothing left for them to change (the ticket was
 * cancelled, made, served, or its bill closed). Answers the ids refused, so the waiters who asked can be told.
 */
export async function refusePending(tx: Prisma.TransactionClient, orderIds: readonly string[], deciderId: string | null): Promise<string[]> {
  const open = await tx.orderChange.findMany({ where: { orderId: { in: [...orderIds] }, status: 'PENDING' }, select: { id: true }, take: 200 })
  if (open.length === 0) return []
  const ids = open.map((change) => change.id)
  await tx.orderChange.updateMany({ where: { id: { in: ids } }, data: { status: 'REFUSED', decidedById: deciderId, decidedAt: new Date() } })
  return ids
}
