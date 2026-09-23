// lib/insights-dishes.ts
// The report's per-dish reading: which dishes are looked at, which are ordered, and which are
// looked at and then passed over — the one a manager can do something about (a photo, a price, a
// description). Pure arithmetic over what `countDishes` returned.

/** One dish over the report's window. */
export interface DishStat {
  id: string
  name: string
  views: number
  arViews: number
  cartAdds: number
  /** Portions ordered, in orders that were not cancelled. */
  ordered: number
  revenueMinor: number
}

/** How many dishes a ranking shows: enough to act on, few enough to read at a glance. */
export const TOP_DISHES = 5

/** The dishes with the most of `pick`, most first, ties by name so the order is stable; none of zero. */
export function topBy(stats: readonly DishStat[], pick: (dish: DishStat) => number, count = TOP_DISHES): DishStat[] {
  return stats
    .filter((dish) => pick(dish) > 0)
    .sort((a, b) => pick(b) - pick(a) || a.name.localeCompare(b.name))
    .slice(0, count)
}

/**
 * Below this many opens a dish's order rate is noise: one view and no order is not a finding.
 * The bar also rises with the menu's busiest dish, so a quiet corner of a busy menu is not
 * held up against its headliners on three views.
 */
function enoughViews(stats: readonly DishStat[]): number {
  const most = Math.max(0, ...stats.map((dish) => dish.views))
  return Math.max(10, Math.ceil(most * 0.1))
}

/** Portions ordered per hundred opens: how often looking at a dish ends in ordering it. */
export function orderRate(dish: Pick<DishStat, 'views' | 'ordered'>): number {
  return dish.views > 0 ? (dish.ordered / dish.views) * 100 : 0
}

/**
 * How many of something per dish opened, to one decimal: `1.7 per dish opened`. Not a percentage,
 * because it is not a share — a guest taps + three times on one open, and a waiter orders without
 * opening anything. Null when nothing was opened.
 */
export function perOpen(count: number, views: number): string | null {
  if (views <= 0) return null
  return `${(count / views).toLocaleString('en-GB', { maximumFractionDigits: 1 })} per dish opened`
}

/**
 * Dishes guests open and then do not order: well looked at, and converting at less than half the
 * menu's own rate. Lowest rate first. Empty when nothing was ordered at all — then every dish
 * would qualify, and the finding is the menu's, not a dish's.
 */
export function overlooked(stats: readonly DishStat[], count = TOP_DISHES): DishStat[] {
  const views = stats.reduce((n, dish) => n + dish.views, 0)
  const ordered = stats.reduce((n, dish) => n + dish.ordered, 0)
  if (views === 0 || ordered === 0) return []
  const menuRate = orderRate({ views, ordered })
  const floor = enoughViews(stats)
  return stats
    .filter((dish) => dish.views >= floor && orderRate(dish) < menuRate / 2)
    .sort((a, b) => orderRate(a) - orderRate(b) || b.views - a.views)
    .slice(0, count)
}
