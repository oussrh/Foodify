// lib/insights-scores.ts
// The report's headline figures, grouped by the question they answer, each with how it moved
// against the window before it (`lib/insights-delta.ts`). More orders is good, a longer wait is
// not; the tile says which in words and an arrow as well as a colour.
import { conversion, formatDuration, type InsightsTotals } from '@/lib/insights'
import { formatPrice, type Money } from '@/lib/menu'
import { fromMinorUnits } from '@/lib/money'
import { percentDelta, pointsDelta, type Delta } from '@/lib/insights-delta'
import { perOpen } from '@/lib/insights-dishes'

/** One headline figure: its name, its value in words, a quieter note, and how it moved. */
export interface Score {
  label: string
  value: string
  hint?: string
  /** Null when there is nothing to compare with: no earlier figure, or an earlier zero. */
  delta: Delta | null
}

const orders = (t: InsightsTotals) => t.guestOrders + t.staffOrders

/** What an order that was not cancelled came to on average, in minor units; null without one. */
export function averageOrderMinor(t: InsightsTotals): number | null {
  const kept = orders(t) - t.cancelledOrders
  return kept > 0 ? Math.round(t.revenueMinor / kept) : null
}

/** An amount in minor units in the restaurant's currency; a dash where there is none. */
export function formatMinor(minor: number | null, money: Money): string {
  return minor === null ? '—' : formatPrice(fromMinorUnits(minor), money)
}

const percent = (rate: number | null) => (rate === null ? '—' : `${rate}%`)

/** How much the menu is read, and — where the restaurant takes orders — how often it fills a cart. */
export function audienceScores(now: InsightsTotals, before: InsightsTotals, ordering: boolean): Score[] {
  const arRate = conversion(now.arViews, now.views)
  const cartRate = perOpen(now.cartAdds, now.views)
  const scores: Score[] = [
    { label: 'Dishes opened', value: now.views.toLocaleString('en-GB'), delta: percentDelta(now.views, before.views, 'up') },
    {
      label: 'AR sessions',
      value: now.arViews.toLocaleString('en-GB'),
      ...(arRate !== null ? { hint: `${arRate}% of dishes opened` } : {}),
      delta: percentDelta(now.arViews, before.arViews, 'up'),
    },
  ]
  if (!ordering) return scores
  return [
    ...scores,
    {
      label: 'Added to cart',
      value: now.cartAdds.toLocaleString('en-GB'),
      ...(cartRate !== null ? { hint: cartRate } : {}),
      delta: percentDelta(now.cartAdds, before.cartAdds, 'up'),
    },
  ]
}

/** What the reading turned into: orders, and what they came to. */
export function salesScores(now: InsightsTotals, before: InsightsTotals, money: Money): Score[] {
  // Guests only: a waiter's order never passed through the public menu, so it has no view behind it.
  const rate = (t: InsightsTotals) => conversion(t.guestOrders, t.views)
  return [
    {
      label: 'Orders',
      value: orders(now).toLocaleString('en-GB'),
      hint: `${now.guestOrders.toLocaleString('en-GB')} by guests · ${now.staffOrders.toLocaleString('en-GB')} by waiters`,
      delta: percentDelta(orders(now), orders(before), 'up'),
    },
    { label: 'Revenue', value: formatMinor(now.revenueMinor, money), delta: percentDelta(now.revenueMinor, before.revenueMinor, 'up') },
    {
      label: 'Average order',
      value: formatMinor(averageOrderMinor(now), money),
      delta: percentDelta(averageOrderMinor(now), averageOrderMinor(before), 'up'),
    },
    {
      label: 'Order rate',
      value: percent(rate(now)),
      hint: 'Guest orders per dish opened',
      delta: pointsDelta(rate(now), rate(before), 'up'),
    },
  ]
}

/** How the kitchen and the floor turned the orders round. Shorter is better; so is fewer cancelled. */
export function kitchenScores(now: InsightsTotals, before: InsightsTotals): Score[] {
  const cancelled = (t: InsightsTotals) => conversion(t.cancelledOrders, orders(t))
  return [
    { label: 'Time to accept', value: formatDuration(now.acceptSeconds), delta: percentDelta(now.acceptSeconds, before.acceptSeconds, 'down') },
    { label: 'Time to prepare', value: formatDuration(now.prepSeconds), delta: percentDelta(now.prepSeconds, before.prepSeconds, 'down') },
    { label: 'Time to serve', value: formatDuration(now.serveSeconds), delta: percentDelta(now.serveSeconds, before.serveSeconds, 'down') },
    {
      label: 'Cancelled',
      value: percent(cancelled(now)),
      hint: `${now.cancelledOrders.toLocaleString('en-GB')} of ${orders(now).toLocaleString('en-GB')} orders`,
      delta: pointsDelta(cancelled(now), cancelled(before), 'down'),
    },
  ]
}
