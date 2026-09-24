// lib/insights.ts
// The shape of the insights report: which grains it can be read at, how far back each one
// looks, and how a row of it is written down. The numbers themselves come from the database
// (`lib/insights-loader.ts`); everything here is arithmetic and wording, so it is testable
// without one.

/** How the report is bucketed. The stored grain names are Postgres `date_trunc` fields. */
export const GRAINS = ['day', 'week', 'month', 'year'] as const
/** One of `GRAINS`. */
export type Grain = (typeof GRAINS)[number]

/** A grain as a reader chooses it, and the stretch of time it covers. */
export const GRAIN_LABEL: Record<Grain, string> = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' }

/**
 * How many buckets each grain shows. Enough to see a shape — a month of days, a quarter of
 * weeks, a year of months — without a table nobody scrolls to the end of.
 */
export const GRAIN_BUCKETS: Record<Grain, number> = { day: 30, week: 12, month: 12, year: 5 }

/** The stretch each grain covers, said in words, for the page to put under its heading. */
export const GRAIN_WINDOW: Record<Grain, string> = {
  day: 'the last 30 days',
  week: 'the last 12 weeks',
  month: 'the last 12 months',
  year: 'the last 5 years',
}

/** What one bucket of the report counts. Every figure is of the bucket alone, never cumulative. */
export interface InsightsBucket {
  /** The start of the bucket, as `date_trunc` put it. */
  start: Date
  /** Dishes opened on the public menu: the sheet or the dish's own page. */
  views: number
  /** Of those views, the ones that launched AR. */
  arViews: number
  /** Dishes put into an order on the public menu, sent or not. */
  cartAdds: number
  /** Orders a guest sent from their own phone. */
  guestOrders: number
  /** Orders a waiter took at the table. */
  staffOrders: number
  /** Seconds from the order arriving to the kitchen taking it on, averaged; null when none was. */
  acceptSeconds: number | null
  /** Seconds from the order arriving to it going out, averaged; null when none went out. */
  serveSeconds: number | null
  /** Seconds from the kitchen taking it on to calling it up, averaged; null when none was called. */
  prepSeconds: number | null
  /** Of the orders, the ones cancelled. They are still counted in the two order figures above. */
  cancelledOrders: number
  /** What the orders that were not cancelled came to, in minor units (cents): money is never a float. */
  revenueMinor: number
}

/** The whole window at once, for the figures above the charts. */
export type InsightsTotals = Omit<InsightsBucket, 'start'>

/**
 * The start of the bucket a date falls in, the way Postgres `date_trunc` would put it: midnight
 * UTC, and for a week the Monday, because that is the day `date_trunc('week')` starts on.
 */
function startOfGrain(date: Date, grain: Grain): Date {
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  // getUTCDay() counts Sunday as 0; this counts Monday as 0, which is what a week is grouped by.
  if (grain === 'week') start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
  if (grain === 'month') start.setUTCDate(1)
  if (grain === 'year') start.setUTCMonth(0, 1)
  return start
}

/** One grain later. Mutates, and is only ever given a bucket start, so no month-end rolls over. */
function step(start: Date, grain: Grain, by: number) {
  if (grain === 'day') start.setUTCDate(start.getUTCDate() + by)
  if (grain === 'week') start.setUTCDate(start.getUTCDate() + by * 7)
  if (grain === 'month') start.setUTCMonth(start.getUTCMonth() + by)
  if (grain === 'year') start.setUTCFullYear(start.getUTCFullYear() + by)
}

/**
 * The start of the window a grain looks back over, from `now`, inclusive of the bucket `now` is
 * in. It is a bucket boundary, not `now` shifted back: a window starting mid-month would put
 * half of October in a bucket labelled October and make a thirteenth one out of the remainder.
 */
export function windowStart(grain: Grain, now: Date, count = GRAIN_BUCKETS[grain]): Date {
  const start = startOfGrain(now, grain)
  step(start, grain, -(count - 1))
  return start
}

/**
 * Every bucket start in the window, oldest first, so a quiet day is a row of zeros and not a gap.
 * `count` defaults to the grain's window; the report asks for two, the one before being what a
 * change is measured against.
 */
export function bucketStarts(grain: Grain, now: Date, count = GRAIN_BUCKETS[grain]): Date[] {
  const cursor = windowStart(grain, now, count)
  return Array.from({ length: count }, () => {
    const start = new Date(cursor)
    step(cursor, grain, 1)
    return start
  })
}

/**
 * The totals of a window: counts add up, and the two averages are re-weighted by the orders
 * behind them. Averaging the bucket averages would let a quiet Tuesday with one slow order
 * count as much as a Saturday with eighty.
 */
export function totalsOf(buckets: InsightsBucket[]): InsightsTotals {
  const sum = (pick: (b: InsightsBucket) => number) => buckets.reduce((n, b) => n + pick(b), 0)
  const weighted = (seconds: (b: InsightsBucket) => number | null, orders: (b: InsightsBucket) => number) => {
    const counted = buckets.filter((b) => seconds(b) !== null && orders(b) > 0)
    const n = counted.reduce((total, b) => total + orders(b), 0)
    if (n === 0) return null
    return counted.reduce((total, b) => total + seconds(b)! * orders(b), 0) / n
  }
  const orders = (b: InsightsBucket) => b.guestOrders + b.staffOrders
  return {
    views: sum((b) => b.views),
    arViews: sum((b) => b.arViews),
    cartAdds: sum((b) => b.cartAdds),
    guestOrders: sum((b) => b.guestOrders),
    staffOrders: sum((b) => b.staffOrders),
    acceptSeconds: weighted((b) => b.acceptSeconds, orders),
    serveSeconds: weighted((b) => b.serveSeconds, orders),
    prepSeconds: weighted((b) => b.prepSeconds, orders),
    cancelledOrders: sum((b) => b.cancelledOrders),
    revenueMinor: sum((b) => b.revenueMinor),
  }
}

/** A duration as a kitchen says it: "4 min", "1 h 12 min", "—" for a stage nothing reached. */
export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—'
  const minutes = Math.round(Math.max(seconds, 0) / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}

/** How many of the menu's readers ordered something, as a whole percentage; null when nobody read it. */
export function conversion(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 100)
}

/** A bucket's own name: the day, the week's first day, the month, the year. */
export function bucketLabel(start: Date, grain: Grain): string {
  const day: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }
  if (grain === 'day') return start.toLocaleDateString('en-GB', day)
  if (grain === 'week') return `Week of ${start.toLocaleDateString('en-GB', day)}`
  if (grain === 'month') return start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return String(start.getUTCFullYear())
}
