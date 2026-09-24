// lib/table-tab.ts
// One bill per table visit. A table's tab is the order that opened it and every addition sent to
// it since: the guests asked for more, the waiter added it, and the kitchen got a second ticket
// rather than a second, unrelated order. What counts as the table's current tab, whether an
// order may be added to, whether a send should add to it by default, and what the whole bill
// comes to are decided here, once, so the route that refuses an addition and the screen that
// offers one never disagree. Client-safe.
//
// A bill belongs to one service day (lib/availability.ts `serviceDayStart`, the restaurant's
// local 04:00): the boundary a sold-out dish returns at, so the kitchen's day ends once for
// everything, and last night's 23:30 bill is never this lunchtime's.
import { fromMinorUnits, toMinorUnits } from '@/lib/money'
import type { BoardOrder, OrderStatus } from '@/lib/orders'

/** The facts of an order that decide whether it is a table's open bill. */
export interface TabFacts {
  restaurantId: string
  table: string
  parentId: string | null
  status: OrderStatus
  createdAt: Date | string
}

/** Where an order would go: this restaurant, this table, and when the current service day began. */
export interface TabPlace {
  restaurantId: string
  table: string
  /** `serviceDayStart(now, restaurant.timeZone)`: a bill opened before it is a previous service's. */
  serviceStart: Date
}

/** Why an addition was refused: the order it names is not this table's open bill. */
export type AddToRefusal = 'not_found' | 'other_table' | 'not_a_parent' | 'cancelled' | 'previous_service'

/** What the waiter is told for each refusal: the kitchen's answer, and what to do instead. */
export const ADD_TO_REFUSED: Record<AddToRefusal, string> = {
  not_found: 'That order is not one of this restaurant’s',
  other_table: 'That order belongs to another table',
  not_a_parent: 'That is an addition itself; add to the order that opened the table',
  cancelled: 'That order was cancelled; send a new order',
  previous_service: 'That order is from an earlier service; send a new order',
}

/**
 * Why `order` may not be added to by an order for `at`, or null when it may. Another
 * restaurant's order reads as not found, so a guess learns nothing about another tenant. Checked
 * in this order because each answer is more specific than the last.
 */
export function addToRefusal(order: TabFacts | null, at: TabPlace): AddToRefusal | null {
  if (!order || order.restaurantId !== at.restaurantId) return 'not_found'
  if (order.table !== at.table) return 'other_table'
  if (order.parentId !== null) return 'not_a_parent'
  if (order.status === 'CANCELLED') return 'cancelled'
  if (new Date(order.createdAt).getTime() < at.serviceStart.getTime()) return 'previous_service'
  return null
}

/**
 * The table's current bill among `orders`: the most recent one of this service that may still be
 * added to, or null when the table has none. The most recent, because two parties at one table
 * in a day are two bills, and the one still sitting there is the later.
 */
export function currentTab<T extends TabFacts>(orders: readonly T[], at: TabPlace): T | null {
  const open = orders.filter((order) => addToRefusal(order, at) === null)
  return open.reduce<T | null>((latest, order) => (latest && new Date(latest.createdAt) >= new Date(order.createdAt) ? latest : order), null)
}

/**
 * How long after a table's last plate went out a new send still reads as more for the same
 * party. Dessert and coffee after the mains is the case the owner asked for, and it comes well
 * inside an hour and a half; a table re-seated for dinner after a lunch served at 13:30 is past
 * it, and its first order opens a bill of its own.
 */
export const ADD_BY_DEFAULT_MINUTES = 90

/** The tickets of a bill a default is read from: each one's status and when it went out. */
type Ticket = { status: OrderStatus; servedAt: string | null }

/**
 * Whether a send at a table with `tab` open should add to it unless the waiter says otherwise:
 * yes while the kitchen or the floor still has any ticket of it (not served, not cancelled), or
 * when its last plate went out within `ADD_BY_DEFAULT_MINUTES` of `now`; otherwise the table has
 * most likely turned over, and the default is a new bill (with adding one tap away).
 */
export function defaultsToAdd(tab: { parent: Ticket; additions: readonly Ticket[] }, now: Date): boolean {
  const tickets = [tab.parent, ...tab.additions]
  if (tickets.some((ticket) => ticket.status !== 'DONE' && ticket.status !== 'CANCELLED')) return true
  const served = tickets.flatMap((ticket) => (ticket.servedAt ? [new Date(ticket.servedAt).getTime()] : []))
  if (served.length === 0) return false
  return now.getTime() - Math.max(...served) <= ADD_BY_DEFAULT_MINUTES * 60_000
}

/** A table's bill as the waiter's phone shows it: the order that opened it, what was added since, and the total. */
export interface TableTab {
  parent: BoardOrder
  /** Oldest first: the order they were sent in. */
  additions: BoardOrder[]
  /** Every ticket's subtotal summed, cancelled ones left out: an exact two-decimal string. */
  total: string
  /** `defaultsToAdd` when it was read: whether the waiter's send adds to it unless they choose otherwise. */
  addByDefault: boolean
}

/** What a bill comes to over its tickets: every subtotal but a cancelled one, summed on integers. */
export function tabTotal(tickets: readonly { status: OrderStatus; subtotal: string }[]): string {
  return fromMinorUnits(tickets.filter((ticket) => ticket.status !== 'CANCELLED').reduce((sum, ticket) => sum + toMinorUnits(ticket.subtotal), 0))
}

/** "Addition to #12" for an order added to a bill, null for one that opened it: what every screen labels it with. */
export function additionLabel(order: { parentNumber: number | null }): string | null {
  return order.parentNumber === null ? null : `Addition to #${order.parentNumber}`
}
