// lib/orders.ts
// The kitchen board's vocabulary: an order as the board renders it (plain JSON, no Decimal),
// what each status means and which one a staff action moves it to. Client-safe: the board and
// the endpoint that feeds it share these, so a status never means two things.

/** Where an order stands. `NEW` is what POST /api/orders writes; the rest are the board's own doing. */
export const ORDER_STATUSES = ['NEW', 'ACCEPTED', 'READY', 'DONE', 'CANCELLED'] as const
/** One of ORDER_STATUSES; the same set as Prisma's OrderStatus enum. */
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/**
 * The three the board works through, in the order service does: waiting, being made, and up on
 * the pass. `READY` is open, not closed — the kitchen has finished but the order has not left, and
 * an order nobody carries is exactly the one a board must keep showing.
 */
export const OPEN_STATUSES = ['NEW', 'ACCEPTED', 'READY'] as const satisfies readonly OrderStatus[]
/** The two an order ends on: off the working board, but not gone — the Served view lists them. */
export const CLOSED_STATUSES = ['DONE', 'CANCELLED'] as const satisfies readonly OrderStatus[]

/** Which orders the board is showing: the ones being worked, or the ones already finished. */
export type BoardView = 'open' | 'served'

/** The statuses a view asks the endpoint for. */
export function viewStatuses(view: BoardView): readonly OrderStatus[] {
  return view === 'open' ? OPEN_STATUSES : CLOSED_STATUSES
}

/** Whether an order is finished: the Served view shows these, and they take no further move. */
export function isClosed(status: OrderStatus): boolean {
  return (CLOSED_STATUSES as readonly OrderStatus[]).includes(status)
}

/** What the board calls each status. */
export const STATUS_LABEL: Record<OrderStatus, string> = {
  NEW: 'New',
  ACCEPTED: 'Preparing',
  READY: 'Ready',
  DONE: 'Served',
  CANCELLED: 'Cancelled',
}

/**
 * One dish of an order as the board shows it: the name as it was ordered, how many were asked
 * for, how many of those were taken off since (removed or voided: the line stays, struck through
 * where it is shown), and what the guest asked for.
 */
export interface BoardLine {
  id: string
  nameEn: string
  nameFr: string
  quantity: number
  removedQuantity: number
  note: string | null
}

/** How many of a line are still wanted: what was asked for less what was taken off. Never negative. */
export function effectiveQuantity(line: { quantity: number; removedQuantity: number }): number {
  return Math.max(0, line.quantity - line.removedQuantity)
}

/**
 * A change to a ticket the kitchen has still to answer (lib/bill-rules.ts): the floor asked to
 * cancel the whole ticket, or to take `quantity` of one line off it, while it was being made.
 */
export interface PendingRequest {
  id: string
  kind: 'CANCEL' | 'REMOVE'
  /** The line a removal is for; null for a cancel. */
  lineId: string | null
  quantity: number | null
  reason: string | null
  note: string | null
  createdAt: string
}

/** When an order was placed, taken on and served; the ones that have not happened yet are null. */
export interface OrderMoments {
  createdAt: string
  acceptedAt: string | null
  servedAt: string | null
}

/**
 * How long each stage took, in whole minutes, or null while that stage has not finished: `toStart`
 * is the table's wait before the kitchen took it on, `toServe` the cooking, `total` the wait the
 * guest actually felt. A clock that ran backwards (a device with the wrong time) reads 0, never
 * a negative duration.
 */
export function orderTimings(moments: OrderMoments): { toStart: number | null; toServe: number | null; total: number | null } {
  const placed = new Date(moments.createdAt).getTime()
  const accepted = moments.acceptedAt ? new Date(moments.acceptedAt).getTime() : null
  const served = moments.servedAt ? new Date(moments.servedAt).getTime() : null
  const minutes = (from: number, to: number) => Math.max(0, Math.round((to - from) / 60000))
  return {
    toStart: accepted === null ? null : minutes(placed, accepted),
    toServe: served === null || accepted === null ? null : minutes(accepted, served),
    total: served === null ? null : minutes(placed, served),
  }
}

/** An order as the board renders it: the dates are ISO strings (JSON has no Date) and the money a decimal string. */
export interface BoardOrder {
  id: string
  number: number
  table: string
  phone: string
  note: string | null
  status: OrderStatus
  subtotal: string
  createdAt: string
  /** When the order last moved: for a finished one, when it was served or cancelled. */
  updatedAt: string
  /** When the kitchen took it on, and when it went out; null until each happens. */
  acceptedAt: string | null
  /** When the kitchen called it up; null until it does. */
  readyAt: string | null
  servedAt: string | null
  /** The member of staff who took the order at the table; null when the guest ordered for themselves. */
  placedBy: { email: string } | null
  /** The order this one adds to, and its number: null on an order that opened its table's bill (lib/table-tab.ts). */
  parentId: string | null
  parentNumber: number | null
  /** When the bill this ticket belongs to was closed (paid, the table let go); null while it is open. */
  billClosedAt: string | null
  lines: BoardLine[]
  /** What the floor has asked the kitchen to take off this ticket and is waiting on, oldest first. */
  requests: PendingRequest[]
}

/** What a member of staff can do to an order from the board or the floor. */
export type OrderMove = 'accept' | 'ready' | 'done' | 'cancel'

/**
 * The status a move takes an order to, or null when it does not apply — which is what makes two
 * tablets pressing at once safe: the second press moves nothing and the caller is told where the
 * order actually stands.
 *
 * `done` still accepts an order that was never marked ready, because a kitchen that plates and
 * hands over in one motion should not be made to press twice to record it.
 */
export function nextStatus(status: OrderStatus, action: OrderMove): OrderStatus | null {
  if (action === 'cancel') return status === 'DONE' ? null : 'CANCELLED'
  if (action === 'accept') return status === 'NEW' ? 'ACCEPTED' : null
  if (action === 'ready') return status === 'NEW' || status === 'ACCEPTED' ? 'READY' : null
  return status === 'NEW' || status === 'ACCEPTED' || status === 'READY' ? 'DONE' : null
}

/** How long an order has been waiting, as the board colours it: new, getting on, late. */
export type WaitingTier = 'fresh' | 'warning' | 'late'

/** Minutes after which an order is no longer fresh: a kitchen reads colour before it reads numbers. */
export const WAIT_WARNING_MIN = 6
/** Minutes after which an order is late, and the board says so in red. */
export const WAIT_LATE_MIN = 12

/** The tier of a wait in minutes. */
export function waitingTier(minutes: number): WaitingTier {
  if (minutes >= WAIT_LATE_MIN) return 'late'
  if (minutes >= WAIT_WARNING_MIN) return 'warning'
  return 'fresh'
}

/** The board's three columns: waiting to be started, being made, and up on the pass. An order of any other status is not on the board. */
export function byStatus<T extends { status: OrderStatus }>(orders: T[]): Record<(typeof OPEN_STATUSES)[number], T[]> {
  return {
    NEW: orders.filter((order) => order.status === 'NEW'),
    ACCEPTED: orders.filter((order) => order.status === 'ACCEPTED'),
    READY: orders.filter((order) => order.status === 'READY'),
  }
}

/** How many items an order is, over every line and net of what was taken off: what the board shows before the details are opened. */
export function itemCount(order: { lines: { quantity: number; removedQuantity: number }[] }): number {
  return order.lines.reduce((total, line) => total + effectiveQuantity(line), 0)
}

/** Whole minutes since the order was placed, never negative; the board turns it into "4 min ago". */
export function minutesWaiting(createdAt: string, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 60000))
}
