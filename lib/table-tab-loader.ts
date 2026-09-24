// lib/table-tab-loader.ts
// Reads a table's current bill (lib/table-tab.ts): the orders that could still be it, narrowed by
// the database to this table's bills of the current service day, and chosen by the pure rule so
// the query and the route's refusal cannot drift apart. Beside it, what the waiter's sheet acts
// on: the table's other open bills (to merge with), the additions that were bills merged into
// this one (to undo), and the kitchen's answers to this bill's requests. Server-only: it reads Prisma.
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import { serviceDayStart } from '@/lib/availability'
import { boardOrderSelect, serializeOrder } from '@/lib/order-data'
import type { BoardOrder } from '@/lib/orders'
import { addToRefusal, billCancelled, currentTab, defaultsToAdd, tabTotal, type RequestAnswer, type TableTab } from '@/lib/table-tab'

/** How many of a table's bills of the day are looked at: a table turns over a few times a day, never dozens. */
const RECENT_BILLS = 10
/** How many of the kitchen's answers the sheet reports back: the latest few are the news. */
const RECENT_ANSWERS = 10

const BILL_SELECT = {
  ...boardOrderSelect,
  additions: { select: boardOrderSelect, orderBy: [{ createdAt: 'asc' }, { number: 'asc' }] },
} satisfies Prisma.OrderSelect

/** The additions of `parentId` that were bills of their own until merged into it: the merge is on record on the bill. */
async function mergedInto(parentId: string, additions: readonly BoardOrder[]) {
  if (additions.length === 0) return []
  const rows = await prisma.orderChange.findMany({
    where: { kind: 'MERGE', orderId: parentId, mergedOrderId: { in: additions.map((addition) => addition.id) } },
    select: { mergedOrderId: true },
    take: RECENT_BILLS,
  })
  const ids = new Set(rows.map((row) => row.mergedOrderId))
  return additions.filter((addition) => ids.has(addition.id)).map((addition) => ({ id: addition.id, number: addition.number }))
}

/** The kitchen's answers to requests on these tickets, newest first. */
async function answersFor(ticketIds: readonly string[]): Promise<RequestAnswer[]> {
  const rows = await prisma.orderChange.findMany({
    where: { orderId: { in: [...ticketIds] }, kind: { in: ['CANCEL', 'REMOVE'] }, decidedAt: { not: null } },
    orderBy: { decidedAt: 'desc' },
    take: RECENT_ANSWERS,
    select: { id: true, orderId: true, kind: true, quantity: true, status: true, decidedAt: true, line: { select: { nameEn: true } } },
  })
  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    kind: row.kind === 'CANCEL' ? 'CANCEL' : 'REMOVE',
    dish: row.line?.nameEn ?? null,
    quantity: row.quantity,
    accepted: row.status === 'APPLIED',
    decidedAt: row.decidedAt?.toISOString() ?? '',
  }))
}

/**
 * The bill open at `table` of `restaurantId` at `now`, with every addition oldest first, the
 * whole bill's total and whether a send adds to it by default, the table's other open bills, what
 * can be un-merged and the kitchen's latest answers; null when the table has none (or the
 * restaurant does not exist). A closed bill is never the open one; a bill whose opening ticket
 * was cancelled while an addition is live still is. The caller guards: this reads what it is asked.
 */
export async function loadTableTab(restaurantId: string, table: string, now: Date = new Date()): Promise<TableTab | null> {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { timeZone: true } })
  if (!restaurant) return null
  const place = { restaurantId, table, serviceStart: serviceDayStart(now, restaurant.timeZone) }
  const rows = await prisma.order.findMany({
    where: { restaurantId, table, parentId: null, createdAt: { gte: place.serviceStart } },
    orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
    take: RECENT_BILLS,
    select: BILL_SELECT,
  })
  // Every row is this restaurant's by the query; the rule is still asked, so it alone decides.
  const candidates = rows.map((row) => ({
    restaurantId,
    table: row.table,
    parentId: row.parentId,
    // The bill's, not the opening ticket's: a bill lives while any ticket of it does.
    cancelled: billCancelled([row, ...row.additions]),
    createdAt: row.createdAt,
    closedAt: row.closedAt,
    row,
  }))
  const open = currentTab(candidates, place)?.row
  if (!open) return null
  const bill = (row: typeof open) => {
    const { additions, ...parentRow } = row
    return { parent: serializeOrder(parentRow), additions: additions.map(serializeOrder) }
  }
  const { parent, additions } = bill(open)
  const others = candidates
    .filter((candidate) => candidate.row.id !== open.id && addToRefusal(candidate, place) === null)
    .map(({ row }) => {
      const other = bill(row)
      return { id: other.parent.id, number: other.parent.number, createdAt: other.parent.createdAt, total: tabTotal([other.parent, ...other.additions]) }
    })
    .reverse()
  return {
    parent,
    additions,
    total: tabTotal([parent, ...additions]),
    addByDefault: defaultsToAdd({ parent, additions }, now),
    others,
    merged: await mergedInto(parent.id, additions),
    answers: await answersFor([parent.id, ...additions.map((addition) => addition.id)]),
  }
}
