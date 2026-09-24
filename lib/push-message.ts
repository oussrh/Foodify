// lib/push-message.ts
// What a staff device's push says (server/push.ts sends it, public/staff-sw.js shows it). English,
// like the dashboards. It names an order by number, table and plate count and nothing else: a
// push travels through a browser vendor's service and sits on a lock screen, so nothing about the
// guest (their phone, their notes) is ever in it.

/**
 * The alerts: a new order for the pass, an order ready for the floor, a request from the floor to
 * take something off a ticket being cooked (for the pass), and the kitchen's answer to it (for
 * the waiter who asked).
 */
export type PushKind = 'order' | 'ready' | 'request' | 'answer'

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

/**
 * What the floor asked the kitchen to take off a ticket being cooked: the whole ticket, or
 * `quantity` of one dish (named as it was ordered; a dish name is the menu's, not the guest's).
 */
export type PushRequest = { changeId: string; orderNumber: number; table: string; dish: string | null; quantity: number | null }

/** "remove 1 Tea" or "cancel order #12": what a request asks, in the words the card uses. */
export function requestWords(request: Pick<PushRequest, 'orderNumber' | 'dish' | 'quantity'>): string {
  return request.dish === null ? `cancel order #${request.orderNumber}` : `remove ${request.quantity ?? 1} ${request.dish}`
}

/** A request from the floor, for the kitchen board: the cook must accept or refuse it on the card. */
export function changeRequestPush(request: PushRequest, restaurant: { id: string; code: string }): PushPayload {
  return {
    restaurantId: restaurant.id,
    title: `Table ${request.table} asks to ${requestWords(request)}`,
    body: 'Accept or refuse it on the board',
    tag: `request-${request.changeId}`,
    url: `/kitchen/orders/${restaurant.code}`,
    kind: 'request',
  }
}

/** The kitchen's answer to a request, for the waiter who asked: opens the waiter's floor. */
export function changeAnswerPush(request: PushRequest, accepted: boolean, restaurant: { id: string; code: string }): PushPayload {
  return {
    restaurantId: restaurant.id,
    title: `Kitchen ${accepted ? 'accepted' : 'refused'}: ${requestWords(request)}`,
    body: `Table ${request.table} · order #${request.orderNumber}`,
    tag: `answer-${request.changeId}`,
    url: `/waiter/${restaurant.code}`,
    kind: 'answer',
  }
}
