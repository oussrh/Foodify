// lib/insights-loader.ts
// The insights report's read: one restaurant, bucketed by day, week, month or year. Three
// grouped queries — views, cart adds, orders — merged onto the bucket list rather than one join,
// because the three tables have nothing to join on but time, and a join across them multiplies
// rows. The grouping is Postgres `date_trunc` in UTC, which is also how `lib/insights.ts` lays
// the buckets out, so a row always lands on one.
import prisma from '@/lib/prisma'
import { AuthError, requireRestaurantAccess } from '@/lib/auth-guard'
import { bucketStarts, windowStart, type Grain, type InsightsBucket } from '@/lib/insights'

/** A `date_trunc` field name. Never interpolated from a caller: the four are the only ones. */
const TRUNC: Record<Grain, string> = { day: 'day', week: 'week', month: 'month', year: 'year' }

type ViewCounts = { views: number; ar_views: number }
type CartCounts = { adds: number }
type OrderCounts = { guest_orders: number; staff_orders: number; accept_seconds: number | null; serve_seconds: number | null }

// A bucket no row fell in is a real answer — nothing happened — so it reads as these rather than
// as a chain of `??` at every field.
const NO_VIEWS: ViewCounts = { views: 0, ar_views: 0 }
const NO_CARTS: CartCounts = { adds: 0 }
const NO_ORDERS: OrderCounts = { guest_orders: 0, staff_orders: 0, accept_seconds: null, serve_seconds: null }

/** Keyed by the bucket's instant, which is what the merge looks a row up by. */
const byBucket = <T extends { bucket: Date }>(rows: T[]) => new Map(rows.map((row) => [row.bucket.getTime(), row]))

/**
 * The three grouped counts of one restaurant since `since`, at `trunc`'s grain. The averages are
 * seconds from the order arriving; a stage an order never reached is left out of its average by
 * the FILTER rather than counted as a zero, and a clock that ran backwards is floored at zero.
 */
async function countBuckets(id: string, trunc: string, since: Date) {
  return Promise.all([
    prisma.$queryRaw<(ViewCounts & { bucket: Date })[]>`
      SELECT date_trunc(${trunc}::text, v."viewedAt") AS bucket,
             count(*)::int AS views,
             (count(*) FILTER (WHERE v."arViewed"))::int AS ar_views
      FROM "DishView" v
      JOIN "Dish" d ON d."id" = v."dishId"
      WHERE d."restaurantId" = ${id} AND v."viewedAt" >= ${since}
      GROUP BY 1`,
    prisma.$queryRaw<(CartCounts & { bucket: Date })[]>`
      SELECT date_trunc(${trunc}::text, c."createdAt") AS bucket, count(*)::int AS adds
      FROM "CartAdd" c
      WHERE c."restaurantId" = ${id} AND c."createdAt" >= ${since}
      GROUP BY 1`,
    prisma.$queryRaw<(OrderCounts & { bucket: Date })[]>`
      SELECT date_trunc(${trunc}::text, o."createdAt") AS bucket,
             (count(*) FILTER (WHERE o."placedById" IS NULL))::int AS guest_orders,
             (count(*) FILTER (WHERE o."placedById" IS NOT NULL))::int AS staff_orders,
             (avg(GREATEST(EXTRACT(EPOCH FROM (o."acceptedAt" - o."createdAt")), 0))
               FILTER (WHERE o."acceptedAt" IS NOT NULL))::float8 AS accept_seconds,
             (avg(GREATEST(EXTRACT(EPOCH FROM (o."servedAt" - o."createdAt")), 0))
               FILTER (WHERE o."servedAt" IS NOT NULL))::float8 AS serve_seconds
      FROM "Order" o
      WHERE o."restaurantId" = ${id} AND o."createdAt" >= ${since}
      GROUP BY 1`,
  ])
}

/**
 * Every figure the report shows, one row per bucket, oldest first, with the empty buckets
 * present as zeros — a quiet Tuesday is a fact, not a gap. Null for a restaurant that is not
 * this reader's to open (a device is refused: it has no business reading the takings).
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
    select: { id: true, name: true, orderingEnabled: true },
  })
  if (!restaurant) return null

  const [views, carts, orders] = await countBuckets(id, TRUNC[grain], windowStart(grain, now))
  const viewsAt = byBucket(views)
  const cartsAt = byBucket(carts)
  const ordersAt = byBucket(orders)

  const buckets: InsightsBucket[] = bucketStarts(grain, now).map((start) => {
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
    }
  })

  return { restaurant, buckets }
}
