import { describe, expect, it } from 'vitest'
import { loadInsights } from '@/lib/insights-loader'
import { totalsOf } from '@/lib/insights'
import { withRollback } from './db'
import { dish, manager, restaurant } from './fixtures'
import { signInAs } from './session'
import { at, order } from './insights-orders'

// The figures the report added over its first version: money, cancellations and the preparing
// time in the buckets, the window before for the changes, and the per-dish, hourly and device
// breakdowns. Pinned on a real database because each is SQL a mock cannot check: a numeric sum
// that must stay exact, a FILTER that must leave the cancelled out, an ISODOW that must start on
// Monday, a line whose dish was deleted.

const NOW = new Date('2026-09-22T18:00:00Z')

describe('the insights report, money and kitchen', () => {
  it('sums the revenue exactly and leaves a cancelled order out of it, but not out of the count', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await order(tx, mine.id, { number: 1, created: '2026-09-22T12:00:00Z', subtotal: '10.10', status: 'DONE' })
      await order(tx, mine.id, { number: 2, created: '2026-09-22T12:10:00Z', subtotal: '0.20', status: 'DONE' })
      await order(tx, mine.id, { number: 3, created: '2026-09-22T12:20:00Z', subtotal: '50.00', status: 'CANCELLED' })
      signInAs(await manager(tx, [mine.id]))

      const totals = totalsOf((await loadInsights(mine.id, 'day', NOW))!.buckets)

      // 10.10 + 0.20 as floats is 10.299999…; in minor units it is 1030 exactly.
      expect(totals).toMatchObject({ revenueMinor: 1030, cancelledOrders: 1, guestOrders: 3 })
    }))

  it('times the preparing from acceptance to being called up, among the orders that were', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await order(tx, mine.id, { number: 1, created: '2026-09-22T12:00:00Z', accepted: '2026-09-22T12:02:00Z', ready: '2026-09-22T12:12:00Z' })
      await order(tx, mine.id, { number: 2, created: '2026-09-22T13:00:00Z', accepted: '2026-09-22T13:05:00Z', ready: '2026-09-22T13:25:00Z' })
      // Accepted and still cooking: no preparing time yet, and not a zero one.
      await order(tx, mine.id, { number: 3, created: '2026-09-22T14:00:00Z', accepted: '2026-09-22T14:01:00Z' })
      signInAs(await manager(tx, [mine.id]))

      const report = await loadInsights(mine.id, 'day', NOW)
      const today = report!.buckets.at(-1)!

      expect(today.prepSeconds).toBeCloseTo(900, 5)
    }))

  it('reads the window before the one shown, for the changes, and keeps the two apart', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      // Inside the 30 days shown.
      await order(tx, mine.id, { number: 1, created: '2026-09-20T12:00:00Z' })
      // In the 30 days before them: 2026-07-25 to 2026-08-23.
      await order(tx, mine.id, { number: 2, created: '2026-08-10T12:00:00Z' })
      await order(tx, mine.id, { number: 3, created: '2026-07-26T12:00:00Z' })
      // Before both.
      await order(tx, mine.id, { number: 4, created: '2026-06-01T12:00:00Z' })
      signInAs(await manager(tx, [mine.id]))

      const report = await loadInsights(mine.id, 'day', NOW)

      expect(report!.previous).toHaveLength(30)
      expect(report!.previous.at(-1)!.start.toISOString()).toBe('2026-08-23T00:00:00.000Z')
      expect(totalsOf(report!.buckets).guestOrders).toBe(1)
      expect(totalsOf(report!.previous).guestOrders).toBe(2)
    }))
})

describe('the insights report, breakdowns', () => {
  it("counts days and hours on the restaurant's own clock", () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await tx.restaurant.update({ where: { id: mine.id }, data: { timeZone: 'America/New_York', orderingEnabled: true } })
      // 02:00 UTC on Tuesday 22 September is 22:00 on Monday 21 September in New York.
      await order(tx, mine.id, { number: 1, created: '2026-09-22T02:00:00Z' })
      signInAs(await manager(tx, [mine.id]))

      const report = (await loadInsights(mine.id, 'day', NOW))!

      const monday = report.buckets.find((b) => b.start.toISOString() === '2026-09-21T00:00:00.000Z')
      const tuesday = report.buckets.find((b) => b.start.toISOString() === '2026-09-22T00:00:00.000Z')
      expect(monday?.guestOrders).toBe(1)
      expect(tuesday?.guestOrders).toBe(0)
      expect(report.rhythm[0]![22]).toBe(1)
      expect(report.timeZone).toBe('America/New_York')
    }))

  it('counts each dish opened, put in a cart and ordered, and only this restaurant\'s', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      const tagine = await dish(tx, mine.id, { nameEn: 'Tagine' })
      const quiet = await dish(tx, mine.id, { nameEn: 'Quiet' })
      const elsewhere = await dish(tx, theirs.id)
      await tx.dishView.createMany({
        data: [
          { dishId: tagine.id, viewedAt: at('2026-09-22T09:00:00Z'), deviceType: 'iOS', arViewed: true },
          { dishId: tagine.id, viewedAt: at('2026-09-22T09:05:00Z'), deviceType: 'Android', arViewed: false },
          { dishId: elsewhere.id, viewedAt: at('2026-09-22T09:06:00Z'), deviceType: 'iOS', arViewed: false },
        ],
      })
      await tx.cartAdd.create({ data: { dishId: tagine.id, restaurantId: mine.id, createdAt: at('2026-09-22T09:10:00Z') } })
      const line = { dishId: tagine.id, quantity: 2, unitPrice: '12.50' }
      await order(tx, mine.id, { number: 1, created: '2026-09-22T12:00:00Z', lines: [line] })
      await order(tx, mine.id, { number: 2, created: '2026-09-22T12:30:00Z', status: 'CANCELLED', lines: [line] })
      signInAs(await manager(tx, [mine.id]))

      const report = await loadInsights(mine.id, 'day', NOW)

      expect(report!.dishes).toEqual([
        { id: tagine.id, name: 'Tagine', views: 2, arViews: 1, cartAdds: 1, ordered: 2, revenueMinor: 2500 },
      ])
      expect(report!.dishes.some((d) => d.id === quiet.id)).toBe(false)
    }))

  it('keeps an order line whose dish was deleted out of the dishes, not out of the orders', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const gone = await dish(tx, mine.id)
      await order(tx, mine.id, { number: 1, created: '2026-09-22T12:00:00Z', lines: [{ dishId: gone.id, quantity: 1, unitPrice: '9.50' }] })
      await tx.orderLine.updateMany({ where: { dishId: gone.id }, data: { dishId: null } })
      signInAs(await manager(tx, [mine.id]))

      const report = await loadInsights(mine.id, 'day', NOW)

      expect(report!.dishes).toEqual([])
      expect(totalsOf(report!.buckets).guestOrders).toBe(1)
    }))

  it('lays orders out by ISO weekday and UTC hour, Monday first', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await tx.restaurant.update({ where: { id: mine.id }, data: { orderingEnabled: true } })
      // 2026-09-21 is a Monday; 2026-09-20 a Sunday.
      await order(tx, mine.id, { number: 1, created: '2026-09-21T20:15:00Z' })
      await order(tx, mine.id, { number: 2, created: '2026-09-21T20:45:00Z' })
      await order(tx, mine.id, { number: 3, created: '2026-09-20T13:00:00Z' })
      signInAs(await manager(tx, [mine.id]))

      const { rhythm } = (await loadInsights(mine.id, 'day', NOW))!

      expect(rhythm[0]![20]).toBe(2)
      expect(rhythm[6]![13]).toBe(1)
    }))

  it('counts dishes opened in the rhythm for a restaurant that takes no orders', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const d = await dish(tx, mine.id)
      await tx.dishView.create({ data: { dishId: d.id, viewedAt: at('2026-09-22T09:30:00Z'), deviceType: 'Other', arViewed: false } })
      signInAs(await manager(tx, [mine.id]))

      const { rhythm, devices } = (await loadInsights(mine.id, 'day', NOW))!

      // 2026-09-22 is a Tuesday.
      expect(rhythm[1]![9]).toBe(1)
      expect(devices).toEqual([{ device: 'Other', views: 1, arViews: 0 }])
    }))
})
