// server/order-moves.ts
// The board's own moves on a ticket (start, ready, served, cancel), under the same lock as every
// other change to it (server/order-lock.ts): the status is read again under the lock and the
// move decided on that, so a tablet's Start can never bring back a ticket the floor cancelled a
// moment earlier, nor Served write over a ticket voided to nothing. A ticket that leaves "being
// made" (ready, served, cancelled) answers the floor's requests still open on it: refused, since
// the food is made or gone, and taking it off is then a manager's void.
import prisma from '@/lib/prisma'
import { nextStatus, type OrderMove, type OrderStatus } from '@/lib/orders'
import { lockOrders } from '@/server/order-lock'
import { enqueuePos } from '@/server/pos/enqueue'
import { refusePending } from '@/server/ticket-apply'
import type { Actor } from '@/server/ticket-changes'

/** Where the ticket stands after the move (or as it stood, when the move no longer applied), and the requests it answered. */
export type MoveOutcome = { id: string; status: OrderStatus; moved: boolean; answered: string[] }

/** The moment a move stamps, and only that one: the history measures its waits from these. */
function stamps(next: OrderStatus): { acceptedAt?: Date; readyAt?: Date; servedAt?: Date } {
  if (next === 'ACCEPTED') return { acceptedAt: new Date() }
  if (next === 'READY') return { readyAt: new Date() }
  if (next === 'DONE') return { servedAt: new Date() }
  return {}
}

/** Moves `orderId` on by `action` in one transaction with the ticket locked; the caller has guarded its restaurant. */
export async function moveOrder(orderId: string, action: OrderMove, actor: Actor): Promise<MoveOutcome> {
  return prisma.$transaction(async (tx) => {
    await lockOrders(tx, [orderId])
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, select: { status: true, restaurantId: true, parentId: true } })
    const next = nextStatus(order.status, action)
    if (!next) return { id: orderId, status: order.status, moved: false, answered: [] }
    await tx.order.update({ where: { id: orderId }, data: { status: next, ...stamps(next) }, select: { id: true } })
    // The board's cancel writes no change row of its own; the POS is told the ticket is off all the same.
    if (next === 'CANCELLED') await enqueuePos(tx, { restaurantId: order.restaurantId, orderId, billId: order.parentId ?? orderId, kind: 'CHANGE' })
    const answered = next === 'ACCEPTED' ? [] : await refusePending(tx, [orderId], actor.id)
    return { id: orderId, status: next, moved: true, answered }
  })
}
