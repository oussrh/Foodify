// server/order-owner.ts
// Which restaurant a ticket, a bill, a line or a request belongs to, read from the row so that an action
// guards the restaurant that actually owns it and never one the caller named. A row that does not
// exist is refused exactly as another tenant's is (lib/auth-guard.ts AuthError, 403), so an id
// cannot be probed through the actions that call these; and nobody signed in is refused (401)
// before any row is read, whatever the id.
import prisma from '@/lib/prisma'
import { AuthError, requireUser } from '@/lib/auth-guard'

/** The restaurant of order `orderId`; anonymous is 401; a missing order is refused like another tenant's. */
export async function orderRestaurant(orderId: string): Promise<string> {
  await requireUser()
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { restaurantId: true } })
  if (!order) throw new AuthError('Forbidden', 403)
  return order.restaurantId
}

/** The ticket and restaurant of line `lineId`; a missing line is refused like another tenant's. */
export async function lineOwner(lineId: string): Promise<{ orderId: string; restaurantId: string }> {
  await requireUser()
  const line = await prisma.orderLine.findUnique({ where: { id: lineId }, select: { orderId: true, order: { select: { restaurantId: true } } } })
  if (!line) throw new AuthError('Forbidden', 403)
  return { orderId: line.orderId, restaurantId: line.order.restaurantId }
}

/** The restaurant of change `changeId` (a request the kitchen answers); a missing one is refused like another tenant's. */
export async function changeRestaurant(changeId: string): Promise<string> {
  await requireUser()
  const change = await prisma.orderChange.findUnique({ where: { id: changeId }, select: { restaurantId: true } })
  if (!change) throw new AuthError('Forbidden', 403)
  return change.restaurantId
}
