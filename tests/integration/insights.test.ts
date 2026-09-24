import { describe, expect, it } from 'vitest'
import { loadInsights } from '@/lib/insights-loader'
import { totalsOf } from '@/lib/insights'
import { withRollback } from './db'
import { dish, kitchenTablet, manager, restaurant, waiter } from './fixtures'
import { signInAs } from './session'
import { at, order } from './insights-orders'

// The report is three grouped queries merged onto a bucket list. What is worth pinning against a
// real database is what a mock cannot see: that `date_trunc` and the bucket arithmetic agree on
// where a row falls, and that an unfinished order is left out of an average rather than counted
// as a zero in it.

const NOW = new Date('2026-09-22T18:00:00Z')

describe('the insights report', () => {
  it('puts each row in the bucket its own timestamp falls in', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const d = await dish(tx, mine.id)
      await tx.dishView.createMany({
        data: [
          { dishId: d.id, viewedAt: at('2026-09-22T09:00:00Z'), deviceType: 'iOS', arViewed: false },
          { dishId: d.id, viewedAt: at('2026-09-22T23:59:00Z'), deviceType: 'iOS', arViewed: true },
          { dishId: d.id, viewedAt: at('2026-09-21T10:00:00Z'), deviceType: 'Other', arViewed: false },
        ],
      })
      signInAs(await manager(tx, [mine.id]))

      const report = await loadInsights(mine.id, 'day', NOW)

      const today = report!.buckets.find((b) => b.start.toISOString() === '2026-09-22T00:00:00.000Z')
      const yesterday = report!.buckets.find((b) => b.start.toISOString() === '2026-09-21T00:00:00.000Z')
      expect(today).toMatchObject({ views: 2, arViews: 1 })
      expect(yesterday).toMatchObject({ views: 1, arViews: 0 })
    }))

  it('shows an empty bucket as zeros rather than leaving it out', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))

      const report = await loadInsights(mine.id, 'day', NOW)

      expect(report!.buckets).toHaveLength(30)
      expect(report!.buckets.every((b) => b.views === 0 && b.cartAdds === 0)).toBe(true)
    }))

  it('counts a guest order and a waiter order apart', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const server = await waiter(tx, [mine.id])
      await order(tx, mine.id, { number: 1, created: '2026-09-22T12:00:00Z' })
      await order(tx, mine.id, { number: 2, created: '2026-09-22T12:30:00Z' })
      await order(tx, mine.id, { number: 3, created: '2026-09-22T13:00:00Z', placedById: server.id })
      signInAs(await manager(tx, [mine.id]))

      const totals = totalsOf((await loadInsights(mine.id, 'day', NOW))!.buckets)

      expect(totals).toMatchObject({ guestOrders: 2, staffOrders: 1 })
    }))

  it('counts a table’s bill once, with its additions in the revenue and in the kitchen’s waits', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      // Taking orders, so the rhythm is of orders rather than of dishes opened.
      await tx.restaurant.update({ where: { id: mine.id }, data: { orderingEnabled: true } })
      const server = await waiter(tx, [mine.id])
      // One bill: 20.00, 2 min to accept; then 5.00 more at the same table, 6 min to accept.
      const table = await order(tx, mine.id, { number: 1, created: '2026-09-22T12:00:00Z', accepted: '2026-09-22T12:02:00Z', placedById: server.id, subtotal: '20.00' })
      await order(tx, mine.id, { number: 2, created: '2026-09-22T12:40:00Z', accepted: '2026-09-22T12:46:00Z', placedById: server.id, subtotal: '5.00', parentId: table.id })
      // And a guest's order of its own: 10.00, 4 min to accept.
      await order(tx, mine.id, { number: 3, created: '2026-09-22T13:00:00Z', accepted: '2026-09-22T13:04:00Z', subtotal: '10.00' })
      signInAs(await manager(tx, [mine.id]))

      const report = (await loadInsights(mine.id, 'day', NOW))!
      const totals = totalsOf(report.buckets)

      // Two orders, not three: an addition is more for a table already counted.
      expect(totals).toMatchObject({ guestOrders: 1, staffOrders: 1, tickets: 3, revenueMinor: 3500 })
      // Every ticket is kitchen work: (2 + 6 + 4) / 3 minutes.
      expect(totals.acceptSeconds).toBeCloseTo(240, 5)
      // The rhythm counts arrivals, and the addition did not arrive: 12:00 and 13:00 once each.
      expect(report.rhythm.flat().reduce((n, count) => n + count, 0)).toBe(2)
    }))

  it('averages only the orders that reached a stage, not the ones still open', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      // 2 min to accept, 20 min to serve.
      await order(tx, mine.id, { number: 1, created: '2026-09-22T12:00:00Z', accepted: '2026-09-22T12:02:00Z', served: '2026-09-22T12:20:00Z' })
      // 8 min to accept, 40 min to serve.
      await order(tx, mine.id, { number: 2, created: '2026-09-22T13:00:00Z', accepted: '2026-09-22T13:08:00Z', served: '2026-09-22T13:40:00Z' })
      // Still waiting: it must not drag either average towards zero.
      await order(tx, mine.id, { number: 3, created: '2026-09-22T14:00:00Z' })
      signInAs(await manager(tx, [mine.id]))

      const totals = totalsOf((await loadInsights(mine.id, 'day', NOW))!.buckets)

      expect(totals.acceptSeconds).toBeCloseTo(300, 5)
      expect(totals.serveSeconds).toBeCloseTo(1800, 5)
    }))

  it('counts the cart adds of this restaurant and no other', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      const mineDish = await dish(tx, mine.id)
      const theirDish = await dish(tx, theirs.id)
      await tx.cartAdd.createMany({
        data: [
          { dishId: mineDish.id, restaurantId: mine.id, createdAt: at('2026-09-22T09:00:00Z') },
          { dishId: mineDish.id, restaurantId: mine.id, createdAt: at('2026-09-22T09:01:00Z') },
          { dishId: theirDish.id, restaurantId: theirs.id, createdAt: at('2026-09-22T09:02:00Z') },
        ],
      })
      signInAs(await manager(tx, [mine.id]))

      expect(totalsOf((await loadInsights(mine.id, 'day', NOW))!.buckets).cartAdds).toBe(2)
    }))

  it('leaves out what happened before the window', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const d = await dish(tx, mine.id)
      await tx.dishView.createMany({
        data: [
          { dishId: d.id, viewedAt: at('2026-09-22T09:00:00Z'), deviceType: 'iOS', arViewed: false },
          // Well outside the 30 days a daily report looks back over.
          { dishId: d.id, viewedAt: at('2026-01-05T09:00:00Z'), deviceType: 'iOS', arViewed: false },
        ],
      })
      signInAs(await manager(tx, [mine.id]))

      expect(totalsOf((await loadInsights(mine.id, 'day', NOW))!.buckets).views).toBe(1)
      // The yearly report looks back five years, so it sees both.
      expect(totalsOf((await loadInsights(mine.id, 'year', NOW))!.buckets).views).toBe(2)
    }))

  it('groups the same rows differently at each grain, over the same totals', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const d = await dish(tx, mine.id)
      await tx.dishView.createMany({
        data: [
          { dishId: d.id, viewedAt: at('2026-09-22T09:00:00Z'), deviceType: 'iOS', arViewed: false },
          { dishId: d.id, viewedAt: at('2026-09-01T09:00:00Z'), deviceType: 'iOS', arViewed: false },
        ],
      })
      signInAs(await manager(tx, [mine.id]))

      const daily = await loadInsights(mine.id, 'day', NOW)
      const monthly = await loadInsights(mine.id, 'month', NOW)

      expect(daily!.buckets).toHaveLength(30)
      expect(monthly!.buckets).toHaveLength(12)
      expect(totalsOf(daily!.buckets).views).toBe(2)
      // Both views are in September, so the month has one bucket carrying both.
      expect(monthly!.buckets.filter((b) => b.views > 0)).toHaveLength(1)
      expect(totalsOf(monthly!.buckets).views).toBe(2)
    }))

  it('is refused to another restaurant, to a device and to nobody', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)

      signInAs(await manager(tx, [mine.id]))
      expect(await loadInsights(theirs.id, 'day', NOW)).toBeNull()

      signInAs(await kitchenTablet(tx, [mine.id]))
      expect(await loadInsights(mine.id, 'day', NOW)).toBeNull()

      signInAs(await waiter(tx, [mine.id]))
      expect(await loadInsights(mine.id, 'day', NOW)).toBeNull()
    }))
})
