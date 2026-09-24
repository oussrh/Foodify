// lib/push-message.ts
// What a staff device's push says (server/push.ts sends it, public/staff-sw.js shows it). English,
// like the dashboards. It names an order by number, table and plate count and nothing else: a
// push travels through a browser vendor's service and sits on a lock screen, so nothing about the
// guest (their phone, their notes) is ever in it.

/** The two alerts: a new order for the pass, an order ready for the floor. */
export type PushKind = 'order' | 'ready'

/** One push as the service worker reads it. */
export type PushPayload = { title: string; body: string; tag: string; url: string; kind: PushKind; restaurantId: string }

/**
 * The facts of an order a push may carry; `dishes` is the number of plates (quantities summed),
 * `parentNumber` the number of the table's bill when this order is an addition to it.
 */
export type PushOrder = { id: string; number: number; table: string; dishes: number; parentNumber?: number | null }

const plates = (n: number) => `${n} ${n === 1 ? 'dish' : 'dishes'}`

/**
 * A new order, for the kitchen board: opens the tablet's board by the restaurant's short code. An
 * addition is titled by the bill it belongs to ("Addition to #12"), because the cook's question is
 * which table's plates it goes out with, and a fresh number would read as a new table. A
 * manager's or an admin's board lives at `/{portal}/orders/<id>`, outside the tablet's address, so
 * the payload also names the restaurant and the worker builds that board's address from its scope.
 */
export function newOrderPush(order: PushOrder, restaurant: { id: string; code: string }): PushPayload {
  const restaurantCode = restaurant.code
  return {
    restaurantId: restaurant.id,
    title: typeof order.parentNumber === 'number' ? `Addition to #${order.parentNumber}` : `New order #${order.number}`,
    body: `Table ${order.table} · ${plates(order.dishes)}`,
    tag: `order-${order.id}`,
    url: `/kitchen/orders/${restaurantCode}`,
    kind: 'order',
  }
}

/** An order the kitchen has called up, for the waiter who carries it: opens the waiter's floor. */
export function orderReadyPush(order: PushOrder, restaurant: { id: string; code: string }): PushPayload {
  const restaurantCode = restaurant.code
  return {
    restaurantId: restaurant.id,
    title: `Table ${order.table} is ready`,
    body: `Order #${order.number} · ${plates(order.dishes)}`,
    tag: `ready-${order.id}`,
    url: `/waiter/${restaurantCode}`,
    kind: 'ready',
  }
}
