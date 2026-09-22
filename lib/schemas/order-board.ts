// lib/schemas/order-board.ts
// What the kitchen board sends: which restaurant's orders it is asking for, and the one action
// a member of staff can take on an order. Both are parsed at the boundary (VALID.1) and both
// are guarded by the restaurant the order belongs to, never by what the body claims.
import { z } from 'zod'
import { ORDER_STATUSES } from '@/lib/orders'
import { uuid } from './common'

/** The board's poll: whose orders, and which statuses to show (the open ones by default). */
export const orderBoardQuery = z.object({
  restaurantId: uuid,
  status: z.array(z.enum(ORDER_STATUSES)).min(1).optional(),
})
/** A staff action on one order: take it on, call it up, call it served, or cancel it. */
export const orderAction = z.object({
  orderId: uuid,
  action: z.enum(['accept', 'ready', 'done', 'cancel']),
})
/** `orderAction` after parsing; `setOrderStatus` takes it after the action's parse. */
export type OrderAction = z.infer<typeof orderAction>
