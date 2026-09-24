// server/order-push.ts
// The order events that wake a staff device, as the route and the board's action raise them.
// Each runs after the response (server/after-response.ts) and reports rather than throws.
import { serverEnv } from '@/lib/env'
import prisma from '@/lib/prisma'
import { newOrderPush, orderReadyPush } from '@/lib/push-message'
import { sendPush } from '@/server/push'

/** How many plates an order is: its quantities summed, which is what the pass and the floor count. */
const platesOf = (lines: readonly { quantity: number }[]) => lines.reduce((sum, line) => sum + line.quantity, 0)

/** A new order, to every kitchen board of the restaurant (`code`, its short link name). */
export function pushNewOrder(
  restaurant: { id: string; code: string },
  order: { id: string; number: number; table: string; lines: readonly { quantity: number }[] },
): Promise<{ sent: number }> {
  const payload = newOrderPush({ id: order.id, number: order.number, table: order.table, dishes: platesOf(order.lines) }, restaurant)
  return sendPush(restaurant.id, 'board', payload)
}

/**
 * An order the kitchen has called up, to the waiters. The waiter who took it at the table is the
 * one who carries it, so only their devices buzz; a guest's order, or one a manager took, goes to
 * every waiter of the restaurant. With push off, the order is not even read.
 */
export async function pushOrderReady(orderId: string): Promise<{ sent: number }> {
  if (!serverEnv.webPush) return { sent: 0 }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      table: true,
      restaurantId: true,
      restaurant: { select: { code: true } },
      placedBy: { select: { id: true, role: true } },
      lines: { select: { quantity: true } },
    },
  })
  if (!order) return { sent: 0 }
  const payload = orderReadyPush({ id: order.id, number: order.number, table: order.table, dishes: platesOf(order.lines) }, { id: order.restaurantId, code: order.restaurant.code })
  const waiter = order.placedBy?.role === 'WAITER' ? order.placedBy.id : undefined
  if (!waiter) return sendPush(order.restaurantId, 'waiter', payload)
  // The waiter who took it first; when no phone of theirs is reachable (notifications off, or no
  // longer on this floor), the whole floor rather than nobody: food on the pass goes cold.
  const targeted = await sendPush(order.restaurantId, 'waiter', payload, { userId: waiter })
  return targeted.sent > 0 ? targeted : sendPush(order.restaurantId, 'waiter', payload)
}
