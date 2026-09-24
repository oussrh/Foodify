'use server'

import { requireBoardAction, requireDeliverAction } from '@/lib/auth-guard'
import type { OrderStatus } from '@/lib/orders'
import { orderAction, type OrderAction } from '@/lib/schemas/order-board'
import { afterResponse } from '@/server/after-response'
import { pushChangeAnswers } from '@/server/change-push'
import { moveOrder } from '@/server/order-moves'
import { orderRestaurant } from '@/server/order-owner'
import { pushOrderReady } from '@/server/order-push'

/**
 * The restaurant's managers or its kitchen tablet, on one of that restaurant's orders (a waiter reads the board but does
 * not move it): the guard reads the order's restaurant from the row, so a caller cannot name someone else's. Parses `orderAction` and moves the order on (accept takes a NEW one on, done
 * serves a NEW or ACCEPTED one, cancel stops anything not already served) in one transaction with the ticket locked
 * (server/order-moves.ts): the status is read again under the lock, and a move that no longer applies leaves the row
 * alone. The move stamps its own moment (`acceptedAt`, `servedAt`), which is what the history measures its waits from. A move to READY pushes to the waiters after the response;
 * a move to READY, DONE or CANCELLED answers the floor's requests still open on the ticket (refused) and tells the waiters who asked.
 * Answers `{ id, status }`, the status as it now stands, so a board that raced another tablet shows the truth.
 */
export async function setOrderStatus(raw: OrderAction) {
  const { orderId, action } = orderAction.parse(raw)
  const restaurantId = await orderRestaurant(orderId)
  // Carrying an order out belongs to the floor, so a waiter may do that one and nothing else.
  const actor = await (action === 'done' ? requireDeliverAction(restaurantId) : requireBoardAction(restaurantId))

  const outcome = await moveOrder(orderId, action, actor)
  // The floor is told the plate is up once the kitchen has its answer (server/order-push.ts).
  if (outcome.moved && outcome.status === 'READY') afterResponse(() => pushOrderReady(orderId))
  if (outcome.answered.length > 0) afterResponse(() => pushChangeAnswers(outcome.answered))
  return { id: outcome.id, status: outcome.status as OrderStatus }
}
