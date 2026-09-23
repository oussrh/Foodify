// lib/insights-loader.ts
// The insights report's read: one restaurant, bucketed by day, week, month or year. The grouped
// queries (`lib/insights-queries.ts`) are merged onto the bucket list rather than joined, because
// the event tables have nothing to join on but time, and a join across them multiplies rows.
// Two windows are read at once — the one shown and the one before it — so every headline figure
// can say how it moved; the per-dish, weekly-rhythm and device figures are of the window shown.
import prisma from '@/lib/prisma'
import { AuthError, requireRestaurantAccess } from '@/lib/auth-guard'
import { bucketStarts, GRAIN_BUCKETS, windowStart, type Grain, type InsightsBucket } from '@/lib/insights'
import type { DishStat } from '@/lib/insights-dishes'
import { rhythmGrid } from '@/lib/insights-rhythm'
import type { Money } from '@/lib/menu'
import { toMinorUnits } from '@/lib/money'
import {
  countBuckets,
  countDevices,
  countDishes,
  countRhythm,
  type CartCounts,
  type OrderCounts,
  type ViewCounts,
} from '@/lib/insights-queries'

/** A `date_trunc` field name. Never interpolated from a caller: the four are the only ones. */
const TRUNC: Record<Grain, string> = { day: 'day', week: 'week', month: 'month', year: 'year' }

// A bucket no row fell in is a real answer — nothing happened — so it reads as these rather than
// as a chain of `??` at every field.
const NO_VIEWS: ViewCounts = { views: 0, ar_views: 0 }
const NO_CARTS: CartCounts = { adds: 0 }
const NO_ORDERS: OrderCounts = {
  guest_orders: 0,
  staff_orders: 0,
  cancelled_orders: 0,
  revenue: '0',
  accept_seconds: null,
  serve_seconds: null,
  prep_seconds: null,
}

/** Keyed by the bucket's instant, which is what the merge looks a row up by. */
const byBucket = <T extends { bucket: Date }>(rows: T[]) => new Map(rows.map((row) => [row.bucket.getTime(), row]))

/** Two windows of buckets, oldest first, with the empty ones present as zeros. */
async function loadBuckets(id: string, grain: Grain, now: Date): Promise<InsightsBucket[]> {
  const count = GRAIN_BUCKETS[grain] * 2
  const [views, carts, orders] = await countBuckets(id, TRUNC[grain], windowStart(grain, now, count))
  const viewsAt = byBucket(views)
  const cartsAt = byBucket(carts)
  const ordersAt = byBucket(orders)
  return bucketStarts(grain, now, count).map((start) => {
    const at = start.getTime()
    const view: ViewCounts = viewsAt.get(at) ?? NO_VIEWS
    const cart: CartCounts = cartsAt.get(at) ?? NO_CARTS
    const order: OrderCounts = ordersAt.get(at) ?? NO_ORDERS
    return {
      start,
      views: view.views,
      arViews: view.ar_views,
      cartAdds: cart.adds,
      guestOrders: order.guest_orders,
      staffOrders: order.staff_orders,
      acceptSeconds: order.accept_seconds,
      serveSeconds: order.serve_seconds,
      prepSeconds: order.prep_seconds,
      cancelledOrders: order.cancelled_orders,
      revenueMinor: toMinorUnits(order.revenue),
    }
  })
}

/** The window's per-dish figures, the weekly rhythm and the phones the menu was read on. */
async function loadBreakdowns(id: string, since: Date, ordering: boolean) {
  const [dishRows, rhythmRows, devices] = await Promise.all([
    countDishes(id, since),
    countRhythm(id, since, ordering ? 'orders' : 'views'),
    countDevices(id, since),
  ])
  const dishes: DishStat[] = dishRows.map((row) => ({
    id: row.id,
    name: row.name,
    views: row.views,
    arViews: row.ar_views,
    cartAdds: row.adds,
    ordered: row.ordered,
    revenueMinor: toMinorUnits(row.revenue),
  }))
  return {
    dishes,
    rhythm: rhythmGrid(rhythmRows),
    devices: devices.map((row) => ({ device: row.device, views: row.views, arViews: row.ar_views })),
  }
}

/**
 * Every figure the report shows: the window's buckets and the window before (`previous`, for the
 * changes), each oldest first, plus the breakdowns of the window shown. Null for a restaurant
 * that is not this reader's to open (a device is refused: it has no business reading the takings).
 */
export async function loadInsights(id: string, grain: Grain, now = new Date()) {
  try {
    await requireRestaurantAccess({ id })
  } catch (error) {
    if (error instanceof AuthError) return null
    throw error
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    select: { id: true, name: true, orderingEnabled: true, currency: true, currencySymbol: true },
  })
  if (!restaurant) return null

  const [all, breakdowns] = await Promise.all([
    loadBuckets(id, grain, now),
    loadBreakdowns(id, windowStart(grain, now), restaurant.orderingEnabled),
  ])
  const shown = GRAIN_BUCKETS[grain]
  // The portals are in English, so the amounts are too; the currency is the restaurant's.
  const money: Money = { locale: 'en', symbol: restaurant.currencySymbol || '$', code: restaurant.currency }
  return { restaurant, money, buckets: all.slice(shown), previous: all.slice(0, shown), ...breakdowns }
}
