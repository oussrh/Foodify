// lib/waiter-floor.ts
// What a waiter's phone shows for each table of the room. Two questions, not one: what is still
// coming from the kitchen, and what is ready to be carried out right now.
//
// "Ready" is a status the kitchen sets (`READY`), not a guess. It was briefly inferred from the
// Served stamp inside a time window, because there was no separate step to end it; there is one
// now, so an order stays ready until somebody carries it and not a minute longer or shorter. The
// window was the kind of heuristic that works until the evening it does not.

import type { BoardOrder } from '@/lib/orders'

/** The orders the kitchen has called up: the food is on the pass and nobody has carried it yet. */
export function readyOrders(orders: BoardOrder[]): BoardOrder[] {
  return orders.filter((order) => order.status === 'READY')
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
