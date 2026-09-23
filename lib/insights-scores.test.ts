import { describe, expect, it } from 'vitest'
import type { InsightsTotals } from './insights'
import { audienceScores, averageOrderMinor, formatMinor, kitchenScores, salesScores } from './insights-scores'
import type { Money } from './menu'

const totals = (over: Partial<InsightsTotals> = {}): InsightsTotals => ({
  views: 0,
  arViews: 0,
  cartAdds: 0,
  guestOrders: 0,
  staffOrders: 0,
  acceptSeconds: null,
  serveSeconds: null,
  prepSeconds: null,
  cancelledOrders: 0,
  revenueMinor: 0,
  ...over,
})

const euro: Money = { locale: 'en', symbol: '€', code: 'EUR' }
const byLabel = <T extends { label: string }>(scores: T[], label: string) => scores.find((s) => s.label === label)

describe('averageOrderMinor', () => {
  it('divides the revenue by the orders that were not cancelled', () => {
    expect(averageOrderMinor(totals({ guestOrders: 3, staffOrders: 1, cancelledOrders: 1, revenueMinor: 4500 }))).toBe(1500)
  })

  it('has no average without a kept order', () => {
    expect(averageOrderMinor(totals({ guestOrders: 1, cancelledOrders: 1 }))).toBeNull()
  })
})

describe('formatMinor', () => {
  it('writes minor units in the restaurant currency, and a dash for nothing', () => {
    expect(formatMinor(123450, euro)).toBe('€1,234.50')
    expect(formatMinor(null, euro)).toBe('—')
  })
})

describe('audienceScores', () => {
  it('shows opens and AR for every restaurant, with the share of opens that went to AR', () => {
    const scores = audienceScores(totals({ views: 200, arViews: 50 }), totals({ views: 100 }), false)
    expect(scores.map((s) => s.label)).toEqual(['Dishes opened', 'AR sessions'])
    expect(byLabel(scores, 'Dishes opened')?.delta?.text).toBe('+100%')
    expect(byLabel(scores, 'AR sessions')).toMatchObject({ value: '50', hint: '25% of dishes opened', delta: null })
  })

  it('adds the cart for a restaurant that takes orders', () => {
    const scores = audienceScores(totals({ views: 40, cartAdds: 10 }), totals({ cartAdds: 5 }), true)
    expect(byLabel(scores, 'Added to cart')).toMatchObject({ value: '10', hint: '0.3 per dish opened' })
    expect(byLabel(scores, 'Added to cart')?.delta?.text).toBe('+100%')
  })

  it('gives no share when nothing was opened', () => {
    const scores = audienceScores(totals(), totals(), true)
    expect(byLabel(scores, 'AR sessions')?.hint).toBeUndefined()
    expect(byLabel(scores, 'Added to cart')?.hint).toBeUndefined()
  })
})

describe('salesScores', () => {
  const now = totals({ views: 100, guestOrders: 6, staffOrders: 4, revenueMinor: 20000 })
  const before = totals({ views: 100, guestOrders: 4, staffOrders: 4, revenueMinor: 16000 })
  const scores = salesScores(now, before, euro)

  it('counts every order and says who placed them', () => {
    expect(byLabel(scores, 'Orders')).toMatchObject({ value: '10', hint: '6 by guests · 4 by waiters' })
    expect(byLabel(scores, 'Orders')?.delta?.text).toBe('+25%')
  })

  it('shows the revenue and the average order in the currency', () => {
    expect(byLabel(scores, 'Revenue')?.value).toBe('€200.00')
    expect(byLabel(scores, 'Average order')?.value).toBe('€20.00')
    expect(byLabel(scores, 'Average order')?.delta?.text).toBe('No change')
  })

  it('reads the order rate from guest orders only, and moves it in points', () => {
    // A waiter's order never went through the public menu, so it is not a converted view.
    expect(byLabel(scores, 'Order rate')?.value).toBe('6%')
    expect(byLabel(scores, 'Order rate')?.delta?.text).toBe('+2 pts')
  })
})

describe('kitchenScores', () => {
  it('counts a shorter wait and fewer cancellations as the good direction', () => {
    const now = totals({ guestOrders: 10, cancelledOrders: 1, acceptSeconds: 120, prepSeconds: 600, serveSeconds: 1200 })
    const before = totals({ guestOrders: 10, cancelledOrders: 3, acceptSeconds: 240, prepSeconds: 600, serveSeconds: 900 })
    const scores = kitchenScores(now, before)
    expect(byLabel(scores, 'Time to accept')).toMatchObject({ value: '2 min', delta: { text: '−50%', tone: 'good' } })
    expect(byLabel(scores, 'Time to prepare')?.delta?.tone).toBe('neutral')
    expect(byLabel(scores, 'Time to serve')?.delta).toMatchObject({ text: '+33%', tone: 'bad' })
    expect(byLabel(scores, 'Cancelled')).toMatchObject({ value: '10%', hint: '1 of 10 orders', delta: { text: '−20 pts', tone: 'good' } })
  })

  it('shows a dash for a wait nothing reached', () => {
    expect(byLabel(kitchenScores(totals(), totals()), 'Time to serve')).toMatchObject({ value: '—', delta: null })
    expect(byLabel(kitchenScores(totals(), totals()), 'Cancelled')?.value).toBe('—')
  })
})
