import { describe, expect, it } from 'vitest'
import { loadInsights } from '@/lib/insights-loader'
import { totalsOf } from '@/lib/insights'
import { withRollback, type Tx } from './db'
import { dish, kitchenTablet, manager, restaurant, waiter } from './fixtures'
import { signInAs } from './session'

// The report is three grouped queries merged onto a bucket list. What is worth pinning against a
// real database is what a mock cannot see: that `date_trunc` and the bucket arithmetic agree on
// where a row falls, and that an unfinished order is left out of an average rather than counted
// as a zero in it.

const NOW = new Date('2026-09-22T18:00:00Z')
const at = (iso: string) => new Date(iso)

interface OrderSpec {
  number: number
  created: string
  accepted?: string
  served?: string
  /** A waiter's id: the order was taken at the table, so there is no phone to text. */
  placedById?: string
}

async function order(tx: Tx, restaurantId: string, spec: OrderSpec) {
  return tx.order.create({
    data: {
      restaurantId,
      number: spec.number,
      table: String(spec.number),
      phone: spec.placedById ? '' : '+212600112233',
      subtotal: '9.50',
      placedById: spec.placedById ?? null,
      createdAt: at(spec.created),
      acceptedAt: spec.accepted ? at(spec.accepted) : null,
      servedAt: spec.served ? at(spec.served) : null,
    },
    select: { id: true },
  })
}

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
