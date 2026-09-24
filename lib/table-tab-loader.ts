// lib/table-tab-loader.ts
// Reads a table's current bill (lib/table-tab.ts): the orders that could still be it, narrowed by
// the database to this table's bills of the current service day, and chosen by the pure rule so
// the query and the route's refusal cannot drift apart. Server-only: it reads Prisma.
import prisma from '@/lib/prisma'
import { serviceDayStart } from '@/lib/availability'
import { boardOrderSelect, serializeOrder } from '@/lib/order-data'
import { currentTab, defaultsToAdd, tabTotal, type TableTab } from '@/lib/table-tab'

/** How many of a table's bills of the day are looked at: a table turns over a few times a day, never dozens. */
const RECENT_BILLS = 10

/**
 * The bill open at `table` of `restaurantId` at `now`, with every addition oldest first, the
 * whole bill's total and whether a send adds to it by default; null when the table has none (or
 * the restaurant does not exist). The caller guards: this reads what it is asked.
 */
export async function loadTableTab(restaurantId: string, table: string, now: Date = new Date()): Promise<TableTab | null> {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId }, select: { timeZone: true } })
  if (!restaurant) return null
  const place = { restaurantId, table, serviceStart: serviceDayStart(now, restaurant.timeZone) }
  const rows = await prisma.order.findMany({
    where: { restaurantId, table, parentId: null, createdAt: { gte: place.serviceStart } },
    orderBy: [{ createdAt: 'desc' }, { number: 'desc' }],
    take: RECENT_BILLS,
    select: { ...boardOrderSelect, additions: { select: boardOrderSelect, orderBy: [{ createdAt: 'asc' }, { number: 'asc' }] } },
  })
  // Every row is this restaurant's by the query; the rule is still asked, so it alone decides.
  const candidates = rows.map((row) => ({ restaurantId, table: row.table, parentId: row.parentId, status: row.status, createdAt: row.createdAt, row }))
  const open = currentTab(candidates, place)?.row
  if (!open) return null
  const { additions, ...parentRow } = open
  const parent = serializeOrder(parentRow)
  const added = additions.map(serializeOrder)
  return { parent, additions: added, total: tabTotal([parent, ...added]), addByDefault: defaultsToAdd({ parent, additions: added }, now) }
}
