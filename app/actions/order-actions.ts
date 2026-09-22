'use server'

import prisma from '@/lib/prisma'
import { requireBoardAction } from '@/lib/auth-guard'
import { nextStatus, type OrderStatus } from '@/lib/orders'
import { orderAction, type OrderAction } from '@/lib/schemas/order-board'

/**
 * The restaurant's managers or its kitchen tablet, on one of that restaurant's orders (a waiter reads the board but does
 * not move it): the guard reads the order's restaurant from the row, so a caller cannot name someone else's. Parses `orderAction` and moves the order on — accept takes a NEW one on, done
 * serves a NEW or ACCEPTED one, cancel stops anything not already served — and a move that does not apply leaves the row
 * alone. The move stamps its own moment (`acceptedAt`, `servedAt`), which is what the history measures its waits from.
 * Answers `{ id, status }`, the status as it now stands, so a board that raced another tablet shows the truth.
 */
export async function setOrderStatus(raw: OrderAction) {
  const { orderId, action } = orderAction.parse(raw)
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { restaurantId: true, status: true } })
  if (!order) throw new Error('Order not found')
  await requireBoardAction(order.restaurantId)

  const next = nextStatus(order.status as OrderStatus, action)
  if (!next) return { id: orderId, status: order.status as OrderStatus }
  const updated = await prisma.order.update({
    where: { id: orderId },
    // The moment is stamped with the move that caused it, and only that move: a later change
    // (a cancel after a serve is refused, but an edit elsewhere is not) leaves these alone.
    data: { status: next, ...(next === 'ACCEPTED' ? { acceptedAt: new Date() } : {}), ...(next === 'DONE' ? { servedAt: new Date() } : {}) },
    select: { id: true, status: true },
  })
  return { id: updated.id, status: updated.status as OrderStatus }
}
