// lib/waiter-floor.ts
// What a waiter's phone shows for each table of the room. Two questions, not one: what is still
// coming from the kitchen, and what is ready to be carried out right now.
//
// "Ready" is the kitchen's Served stamp (`servedAt`), read for a window rather than for ever. The
// board has no separate delivered step — the kitchen says the food is up, and a waiter carries
// it — so an order stays on the floor list for a while and then ages off. That is a heuristic and
// it is worth naming as one: it needs no new status, no migration and no second action during
// service, and the cost of being wrong is a tile that stops glowing while a plate is still on the
// pass. If that starts to matter, the fix is a real READY → DELIVERED step, not a longer window.

import type { BoardOrder } from '@/lib/orders'

/** How long a finished order keeps announcing itself on the floor. Long enough to cross a room, short enough not to pile up. */
export const READY_WINDOW_MINUTES = 30

/** The orders the kitchen has just finished: served, and served recently enough to still be waiting on the pass. */
export function readyOrders(orders: BoardOrder[], now: Date = new Date()): BoardOrder[] {
  const cutoff = now.getTime() - READY_WINDOW_MINUTES * 60_000
  return orders.filter((order) => {
    if (order.status !== 'DONE' || !order.servedAt) return false
    const servedAt = new Date(order.servedAt).getTime()
    return Number.isFinite(servedAt) && servedAt >= cutoff
  })
}

/** What one table's tile says. `ready` outranks `cooking`: a plate waiting on the pass is the thing to act on. */
export type TableState = 'free' | 'cooking' | 'ready'

/** One table as the grid draws it. */
export interface TableTile {
  table: string
  state: TableState
  /** Orders still with the kitchen. */
  cooking: BoardOrder[]
  /** Orders ready to carry out. */
  ready: BoardOrder[]
  /** Items over every open order, for the tile's second line. */
  items: number
  /** The longest anything on this table has waited, in whole minutes. */
  waitingMinutes: number
}

/** The state of every table in the room, in order, from the two polls a waiter runs. */
export function floorTiles(tables: readonly (number | string)[], open: BoardOrder[], ready: BoardOrder[], now: Date = new Date()): TableTile[] {
  return tables.map((value) => {
    const table = String(value)
    const cooking = open.filter((order) => order.table === table)
    const waiting = ready.filter((order) => order.table === table)
    const waits = cooking.map((order) => Math.max(0, Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / 60_000)))
    return {
      table,
      // Ready first: a tile that says "cooking" while a plate goes cold is the wrong answer.
      state: waiting.length > 0 ? 'ready' : cooking.length > 0 ? 'cooking' : 'free',
      cooking,
      ready: waiting,
      items: [...cooking, ...waiting].reduce((n, order) => n + order.lines.reduce((m, line) => m + line.quantity, 0), 0),
      waitingMinutes: waits.length > 0 ? Math.max(...waits) : 0,
    }
  })
}

/** The ids of orders that became ready since the last look; what the phone buzzes about. */
export function newlyReady(ready: BoardOrder[], seen: ReadonlySet<string>): string[] {
  return ready.filter((order) => !seen.has(order.id)).map((order) => order.id)
}
