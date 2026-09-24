// lib/insights-queries.ts
// The insights report's SQL, one grouped query per question. Kept apart from the loader, which
// guards and merges: these read one restaurant since one moment and know nothing about grains or
// buckets beyond the `date_trunc` field they are handed. The timestamps are stored as UTC
// without a zone; each is read on the restaurant's own clock (`(t AT TIME ZONE 'UTC') AT TIME
// ZONE tz`) before it is grouped, so a day is the restaurant's day and an hour its hour. The
// loader lays the buckets out on the same clock (lib/time-zone.ts `wallClock`), so a row always
// lands on one. `since` is an instant and filters the raw column, which keeps its index.
import prisma from '@/lib/prisma'

/** A bucket's dishes opened, and of those the ones that launched AR. */
export type ViewCounts = { views: number; ar_views: number }
/** A bucket's dishes put in a cart. */
export type CartCounts = { adds: number }
/**
 * A bucket's orders: who placed them, how many were cancelled, what they came to, how long they
 * took. An order is a table's bill: an addition to one (`parentId`) is not counted as an order,
 * but its money is in the revenue and its kitchen work in the waits, which are per ticket.
 */
export type OrderCounts = {
  /** Every kitchen ticket, orders and additions alike: what the waits are averaged over. */
  tickets: number
  guest_orders: number
  staff_orders: number
  cancelled_orders: number
  /** A two-decimal string: `sum` of a `numeric(10,2)` keeps its scale, and money is never a float. */
  revenue: string
  accept_seconds: number | null
  serve_seconds: number | null
  prep_seconds: number | null
}
type Bucketed<T> = T & { bucket: Date }

/**
 * The three grouped counts of one restaurant since `since`, at `trunc`'s grain. The averages are
 * seconds between two stamps; a stage an order never reached is left out of its average by the
 * FILTER rather than counted as a zero, and a clock that ran backwards is floored at zero. A
 * cancelled order is an order (it was sent) but brought in nothing, so it is out of the revenue.
 * The order counts are of bills (`parentId` null); revenue and waits take every ticket.
 */
export async function countBuckets(id: string, trunc: string, since: Date, tz: string) {
  return Promise.all([
    prisma.$queryRaw<Bucketed<ViewCounts>[]>`
      SELECT date_trunc(${trunc}::text, (v."viewedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS bucket,
             count(*)::int AS views,
             (count(*) FILTER (WHERE v."arViewed"))::int AS ar_views
      FROM "DishView" v
      JOIN "Dish" d ON d."id" = v."dishId"
      WHERE d."restaurantId" = ${id} AND v."viewedAt" >= ${since}
      GROUP BY 1`,
    prisma.$queryRaw<Bucketed<CartCounts>[]>`
      SELECT date_trunc(${trunc}::text, (c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS bucket, count(*)::int AS adds
      FROM "CartAdd" c
      WHERE c."restaurantId" = ${id} AND c."createdAt" >= ${since}
      GROUP BY 1`,
    prisma.$queryRaw<Bucketed<OrderCounts>[]>`
      SELECT date_trunc(${trunc}::text, (o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS bucket,
             count(*)::int AS tickets,
             (count(*) FILTER (WHERE o."parentId" IS NULL AND o."placedById" IS NULL))::int AS guest_orders,
             (count(*) FILTER (WHERE o."parentId" IS NULL AND o."placedById" IS NOT NULL))::int AS staff_orders,
             (count(*) FILTER (WHERE o."parentId" IS NULL AND o."status" = 'CANCELLED'))::int AS cancelled_orders,
             COALESCE(sum(o."subtotal") FILTER (WHERE o."status" <> 'CANCELLED'), 0)::text AS revenue,
             (avg(GREATEST(EXTRACT(EPOCH FROM (o."acceptedAt" - o."createdAt")), 0))
               FILTER (WHERE o."acceptedAt" IS NOT NULL))::float8 AS accept_seconds,
             (avg(GREATEST(EXTRACT(EPOCH FROM (o."servedAt" - o."createdAt")), 0))
               FILTER (WHERE o."servedAt" IS NOT NULL))::float8 AS serve_seconds,
             (avg(GREATEST(EXTRACT(EPOCH FROM (o."readyAt" - o."acceptedAt")), 0))
               FILTER (WHERE o."readyAt" IS NOT NULL AND o."acceptedAt" IS NOT NULL))::float8 AS prep_seconds
      FROM "Order" o
      WHERE o."restaurantId" = ${id} AND o."createdAt" >= ${since}
      GROUP BY 1`,
  ])
}

/** One dish's window, as the query returns it; only dishes something happened to are returned. */
export type DishRow = {
  id: string
  name: string
  views: number
  ar_views: number
  adds: number
  ordered: number
  revenue: string
}

/**
 * Per dish since `since`: opened, launched in AR, put in a cart, and ordered (portions, and what
 * they came to at the price on the line, both net of what was taken off the line after it was
 * sent: a dish removed or voided was not sold). Grouped apart and joined on the dish, because joining
 * the three event tables to each other would multiply their rows. A line whose dish was deleted
 * has no dish to report under and is left out; the bucket totals still count its order.
 */
export function countDishes(id: string, since: Date) {
  return prisma.$queryRaw<DishRow[]>`
    WITH v AS (
      SELECT v."dishId", count(*)::int AS views, (count(*) FILTER (WHERE v."arViewed"))::int AS ar_views
      FROM "DishView" v JOIN "Dish" d ON d."id" = v."dishId"
      WHERE d."restaurantId" = ${id} AND v."viewedAt" >= ${since}
      GROUP BY 1
    ), c AS (
      SELECT c."dishId", count(*)::int AS adds
      FROM "CartAdd" c
      WHERE c."restaurantId" = ${id} AND c."createdAt" >= ${since}
      GROUP BY 1
    ), o AS (
      SELECT l."dishId", sum(l."quantity" - l."removedQuantity")::int AS ordered,
             sum(l."unitPrice" * (l."quantity" - l."removedQuantity"))::text AS revenue
      FROM "OrderLine" l JOIN "Order" o ON o."id" = l."orderId"
      WHERE o."restaurantId" = ${id} AND o."createdAt" >= ${since}
        AND o."status" <> 'CANCELLED' AND l."dishId" IS NOT NULL
      GROUP BY 1
    )
    SELECT d."id", d."nameEn" AS name,
           COALESCE(v.views, 0) AS views, COALESCE(v.ar_views, 0) AS ar_views,
           COALESCE(c.adds, 0) AS adds, COALESCE(o.ordered, 0) AS ordered, COALESCE(o.revenue, '0') AS revenue
    FROM "Dish" d
    LEFT JOIN v ON v."dishId" = d."id"
    LEFT JOIN c ON c."dishId" = d."id"
    LEFT JOIN o ON o."dishId" = d."id"
    WHERE d."restaurantId" = ${id} AND (v.views IS NOT NULL OR c.adds IS NOT NULL OR o.ordered IS NOT NULL)`
}

/** A count at one weekday (ISO: Monday 1 … Sunday 7) and hour of the day. */
export type RhythmRow = { dow: number; hour: number; count: number }

/**
 * When the restaurant is busy: orders by weekday and hour — or, for a restaurant that takes no
 * orders, dishes opened, which is the only activity it has. An addition is not a new order, so
 * it is not counted here: a table that ordered twice arrived once.
 */
export function countRhythm(id: string, since: Date, of: 'orders' | 'views', tz: string) {
  if (of === 'orders') {
    return prisma.$queryRaw<RhythmRow[]>`
      SELECT EXTRACT(ISODOW FROM (o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::int AS dow,
             EXTRACT(HOUR FROM (o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::int AS hour,
             count(*)::int AS count
      FROM "Order" o
      WHERE o."restaurantId" = ${id} AND o."createdAt" >= ${since} AND o."parentId" IS NULL
      GROUP BY 1, 2`
  }
  return prisma.$queryRaw<RhythmRow[]>`
    SELECT EXTRACT(ISODOW FROM (v."viewedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::int AS dow,
           EXTRACT(HOUR FROM (v."viewedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::int AS hour,
           count(*)::int AS count
    FROM "DishView" v JOIN "Dish" d ON d."id" = v."dishId"
    WHERE d."restaurantId" = ${id} AND v."viewedAt" >= ${since}
    GROUP BY 1, 2`
}

/** Dishes opened on one kind of phone, and how many of those launched AR. */
export type DeviceRow = { device: string; views: number; ar_views: number }

/** Dishes opened per kind of phone since `since`. */
export function countDevices(id: string, since: Date) {
  return prisma.$queryRaw<DeviceRow[]>`
    SELECT v."deviceType"::text AS device, count(*)::int AS views,
           (count(*) FILTER (WHERE v."arViewed"))::int AS ar_views
    FROM "DishView" v JOIN "Dish" d ON d."id" = v."dishId"
    WHERE d."restaurantId" = ${id} AND v."viewedAt" >= ${since}
    GROUP BY 1`
}
