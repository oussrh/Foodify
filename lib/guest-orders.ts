// lib/guest-orders.ts
// The orders a guest placed from this device at one restaurant, as the menu remembers them to
// offer "Your order #12 · Being prepared": a short list, newest first, of the tracking secret and
// what the pill says before the server has answered. Pure functions over the list; the
// localStorage read and write are lib/guest-orders-storage.ts. An order is forgotten once it has
// been finished a while, once it is from an earlier visit, or when the server no longer knows it.
import { isFinished } from '@/lib/guest-status'
import type { OrderStatus } from '@/lib/orders'
import type { GuestOrderEntry } from '@/lib/schemas/order-tracking'

/** At most this many orders are remembered per restaurant: a table's evening, not a history. */
export const MAX_REMEMBERED = 5
/** A served or cancelled order is still shown this long after it was seen finished, then forgotten. */
const FINISHED_KEPT_MS = 3 * 60 * 60 * 1000
/** An order placed longer ago than this is from an earlier visit, whatever it last said. */
const VISIT_MS = 12 * 60 * 60 * 1000

/** What POST /api/orders answered that the list keeps: the secret, and what the pill says before the first poll. */
export type PlacedTracking = { token: string; number: number; table: string }

/**
 * The list with the order just placed at `now` first, sent to the kitchen and not finished: an
 * order already there is replaced, and the oldest past the cap dropped.
 */
export function rememberOrder(list: readonly GuestOrderEntry[], placed: PlacedTracking, now: Date): GuestOrderEntry[] {
  const entry: GuestOrderEntry = { token: placed.token, number: placed.number, table: placed.table, placedAt: now.toISOString(), status: 'NEW', finishedAt: null }
  return [entry, ...list.filter((order) => order.token !== entry.token)].slice(0, MAX_REMEMBERED)
}

/**
 * The list with the order named by `token` at `status`, seen at `now`; the moment it was first
 * seen finished is kept. The same list (the same reference) when nothing changed, so a store
 * that is told the same status on every poll does not re-render.
 */
export function withStatus(list: GuestOrderEntry[], token: string, status: OrderStatus, now: Date): GuestOrderEntry[] {
  const order = list.find((entry) => entry.token === token)
  if (!order || order.status === status) return list
  const finishedAt = isFinished(status) ? (order.finishedAt ?? now.toISOString()) : null
  return list.map((entry) => (entry === order ? { ...entry, status, finishedAt } : entry))
}

/** The list without the order named by `token` (the server no longer knows it); the same list when it was not there. */
export function forgetOrder(list: GuestOrderEntry[], token: string): GuestOrderEntry[] {
  return list.some((entry) => entry.token === token) ? list.filter((entry) => entry.token !== token) : list
}

/** The list without what is over: finished more than a few hours ago, or placed on an earlier visit. */
export function pruneOrders(list: GuestOrderEntry[], now: Date): GuestOrderEntry[] {
  const t = now.getTime()
  const kept = list.filter((entry) => {
    if (t - Date.parse(entry.placedAt) > VISIT_MS) return false
    return !entry.finishedAt || t - Date.parse(entry.finishedAt) <= FINISHED_KEPT_MS
  })
  return kept.length === list.length ? list : kept
}

/** The newest order still to follow (not served, not cancelled), or null when there is none. */
export function activeOrder(list: readonly GuestOrderEntry[]): GuestOrderEntry | null {
  return list.find((entry) => !isFinished(entry.status)) ?? null
}
