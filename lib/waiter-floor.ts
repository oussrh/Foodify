// lib/waiter-floor.ts
// What a waiter's phone shows for each table of the room. Two questions, not one: what is still
// coming from the kitchen, and what is ready to be carried out right now.
//
// "Ready" is a status the kitchen sets (`READY`), not a guess. It was briefly inferred from the
// Served stamp inside a time window, because there was no separate step to end it; there is one
// now, so an order stays ready until somebody carries it and not a minute longer or shorter. The
// window was the kind of heuristic that works until the evening it does not.

import { OPEN_STATUSES, type BoardOrder, type OrderStatus } from '@/lib/orders'

/** The orders the kitchen has called up: the food is on the pass and nobody has carried it yet. */
export function readyOrders(orders: BoardOrder[]): BoardOrder[] {
  return orders.filter((order) => order.status === 'READY')
}

/** What one table's tile says. `ready` outranks `cooking`: a plate waiting on the pass is the thing to act on. */
export type TableState = 'free' | 'cooking' | 'ready'

/**
 * How far along a table's orders are: the least advanced of them, because that is what decides
 * when the table is finished. A table with one dish plated and one not started is still waiting
 * on the kitchen, and a tile that said "Ready" would be telling a waiter to walk over for half
 * an order.
 */
function leastAdvanced(orders: BoardOrder[]): OrderStatus | null {
  for (const status of OPEN_STATUSES) {
    if (orders.some((order) => order.status === status)) return status
  }
  return null
}

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
  /** Where the table's work stands, for the tile to name: the least advanced of its open orders. */
  stage: OrderStatus | null
}

/** The state of every table in the room, in order, from the two polls a waiter runs. */
export function floorTiles(tables: readonly (number | string)[], open: BoardOrder[], ready: BoardOrder[], now: Date = new Date()): TableTile[] {
  return tables.map((value) => {
    const table = String(value)
    const cooking = open.filter((order) => order.table === table)
    const waiting = ready.filter((order) => order.table === table)
    const waits = cooking.map((order) => Math.max(0, Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / 60_000)))
    const everything = [...cooking, ...waiting]
    return {
      table,
      stage: leastAdvanced(everything),
      // Ready first: a tile that says "cooking" while a plate goes cold is the wrong answer.
      state: waiting.length > 0 ? 'ready' : cooking.length > 0 ? 'cooking' : 'free',
      cooking,
      ready: waiting,
      items: everything.reduce((n, order) => n + order.lines.reduce((m, line) => m + line.quantity, 0), 0),
      waitingMinutes: waits.length > 0 ? Math.max(...waits) : 0,
    }
  })
}

/** The ids of orders that became ready since the last look; what the phone buzzes about. */
export function newlyReady(ready: BoardOrder[], seen: ReadonlySet<string>): string[] {
  return ready.filter((order) => !seen.has(order.id)).map((order) => order.id)
}
