import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as placeOrder } from '@/app/api/orders/route'
import { GET as readTab } from '@/app/api/orders/tab/route'
import { serviceDayStart } from '@/lib/availability'
import { storeOrder } from '@/server/order-store'
import { withRollback, type Tx } from './db'
import { dish, kitchenTablet, manager, restaurant, waiter } from './fixtures'
import { signInAs } from './session'

// One bill per table visit, against the real database: a waiter adding to a table that already
// ordered writes one new row pointing at the bill, and leaves the bill itself exactly as the
// kitchen had it. Everything that is not this table's open bill is refused, and a guest may not
// name one at all.

const post = (body: unknown) =>
  placeOrder(new NextRequest('http://test/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))

const tabOf = (restaurantId: string, table: string) => readTab(new Request(`http://test/api/orders/tab?${new URLSearchParams({ restaurantId, table }).toString()}`))

const MINUTE = 60_000

/**
 * The restaurant's zone, chosen so the wall clock is well away from 04:00 whenever the suite
 * runs: a bill made ten minutes ago must be of the same service day as now.
 */
const ZONE = new Date().getUTCHours() < 6 ? 'Asia/Tokyo' : 'UTC'

/** A restaurant taking orders, one dish on its menu, and a waiter signed in to it. */
async function floor(tx: Tx) {
  const mine = await restaurant(tx)
  await tx.restaurant.update({ where: { id: mine.id }, data: { orderingEnabled: true, nextOrderNumber: 13, timeZone: ZONE } })
  const only = await dish(tx, mine.id)
  const staff = await waiter(tx, [mine.id])
  signInAs(staff)
  return { mine, only, staff }
}

/** A table's bill as the kitchen has it: number 12, cooking since ten minutes, by default. */
async function bill(tx: Tx, restaurantId: string, over: { table?: string; status?: 'ACCEPTED' | 'DONE' | 'CANCELLED'; createdAt?: Date; parentId?: string; number?: number } = {}) {
  const createdAt = over.createdAt ?? new Date(Date.now() - 10 * MINUTE)
  return tx.order.create({
    data: {
      restaurantId,
      number: over.number ?? 12,
      table: over.table ?? '4',
      phone: '',
      subtotal: '19.00',
      status: over.status ?? 'ACCEPTED',
      createdAt,
      acceptedAt: new Date(createdAt.getTime() + MINUTE),
      parentId: over.parentId ?? null,
    },
    select: { id: true, number: true, status: true, acceptedAt: true, updatedAt: true, subtotal: true },
  })
}

describe('adding to a table’s bill', () => {
  it('writes one new order pointing at the bill, numbered as its own, and leaves the bill as the kitchen had it', () =>
    withRollback(async (tx) => {
      const { mine, only, staff } = await floor(tx)
      const open = await bill(tx, mine.id)

      const res = await post({ restaurantId: mine.id, table: '4', phone: '', addTo: open.id, lines: [{ dishId: only.id, quantity: 1 }] })
      expect(res.status).toBe(201)
      const { data } = (await res.json()) as { data: { id: string; number: number } }
      expect(data.number).toBe(13)

      const added = await tx.order.findUniqueOrThrow({ where: { id: data.id }, select: { parentId: true, status: true, placedById: true, table: true } })
      expect(added).toEqual({ parentId: open.id, status: 'NEW', placedById: staff.id, table: '4' })
      // The bill is untouched: still cooking, its stamp and its money as they were.
      const after = await tx.order.findUniqueOrThrow({ where: { id: open.id }, select: { id: true, number: true, status: true, acceptedAt: true, updatedAt: true, subtotal: true } })
      expect(after).toEqual(open)
      expect(await tx.order.count({ where: { restaurantId: mine.id } })).toBe(2)
    }))

  it('adds to a bill whose first ticket has already been served', () =>
    withRollback(async (tx) => {
      const { mine, only } = await floor(tx)
      const served = await bill(tx, mine.id, { status: 'DONE' })
      const res = await post({ restaurantId: mine.id, table: '4', phone: '', addTo: served.id, lines: [{ dishId: only.id, quantity: 1 }] })
      expect(res.status).toBe(201)
    }))

  it('refuses a guest who names a bill, rather than quietly placing a new order', () =>
    withRollback(async (tx) => {
      const { mine, only } = await floor(tx)
      const open = await bill(tx, mine.id)
      signInAs(null)

      const res = await post({ restaurantId: mine.id, table: '4', phone: '0600112233', addTo: open.id, lines: [{ dishId: only.id, quantity: 1 }] })
      expect(res.status).toBe(403)
      await expect(res.json()).resolves.toMatchObject({ code: 'forbidden' })
      expect(await tx.order.count({ where: { restaurantId: mine.id } })).toBe(1)
    }))

  it('refuses every bill that is not this table’s open one, and writes nothing', () =>
    withRollback(async (tx) => {
      const { mine, only } = await floor(tx)
      const theirs = await restaurant(tx)
      const cases = [
        ['not_found', await bill(tx, theirs.id)],
        ['other_table', await bill(tx, mine.id, { table: '5', number: 20 })],
        ['cancelled', await bill(tx, mine.id, { status: 'CANCELLED', number: 21 })],
        ['previous_service', await bill(tx, mine.id, { createdAt: new Date(serviceDayStart(new Date(), ZONE).getTime() - MINUTE), number: 22 })],
      ] as const
      const parent = await bill(tx, mine.id, { number: 23 })
      const addition = await bill(tx, mine.id, { number: 24, parentId: parent.id })
      const before = await tx.order.count()

      for (const [reason, target] of [...cases, ['not_a_parent', addition] as const]) {
        const res = await post({ restaurantId: mine.id, table: '4', phone: '', addTo: target.id, lines: [{ dishId: only.id, quantity: 1 }] })
        expect(res.status, reason).toBe(409)
        await expect(res.json()).resolves.toMatchObject({ code: 'unavailable', details: { addTo: reason } })
      }
      expect(await tx.order.count()).toBe(before)
    }))
})

describe('GET /api/orders/tab', () => {
  it('answers the table’s open bill with its additions, oldest first, and the whole bill’s total', () =>
    withRollback(async (tx) => {
      const { mine, only } = await floor(tx)
      // The previous service's bill at the same table is not this one's.
      await bill(tx, mine.id, { number: 3, createdAt: new Date(serviceDayStart(new Date(), ZONE).getTime() - MINUTE) })
      const open = await bill(tx, mine.id)
      for (const quantity of [1, 2]) {
        await post({ restaurantId: mine.id, table: '4', phone: '', addTo: open.id, lines: [{ dishId: only.id, quantity }] })
      }
      await bill(tx, mine.id, { number: 30, status: 'CANCELLED', parentId: open.id, createdAt: new Date(Date.now() + MINUTE) })

      const res = await tabOf(mine.id, '4')
      expect(res.status).toBe(200)
      const { data } = (await res.json()) as { data: { parent: { id: string; number: number }; additions: { number: number; parentNumber: number; status: string }[]; total: string } }
      expect(data.parent).toMatchObject({ id: open.id, number: 12 })
      expect(data.additions.map((a) => [a.number, a.parentNumber, a.status])).toEqual([
        [13, 12, 'NEW'],
        [14, 12, 'NEW'],
        [30, 12, 'CANCELLED'],
      ])
      // 19.00 + 9.50 + 19.00; the cancelled addition's 19.00 is left out.
      expect(data.total).toBe('47.50')
      // Tickets are still with the kitchen, so a send adds to this bill unless the waiter says otherwise.
      expect(data).toMatchObject({ addByDefault: true })
    }))

  it('answers null for a table with nothing open, and refuses a kitchen tablet and a guest', () =>
    withRollback(async (tx) => {
      const { mine } = await floor(tx)
      await bill(tx, mine.id, { status: 'CANCELLED' })
      await expect((await tabOf(mine.id, '4')).json()).resolves.toEqual({ data: null })

      signInAs(await kitchenTablet(tx, [mine.id]))
      expect((await tabOf(mine.id, '4')).status).toBe(403)
      signInAs(null)
      expect((await tabOf(mine.id, '4')).status).toBe(401)
    }))
})

describe('a bill cancelled while the waiter was sending', () => {
  it('is refused under the lock, and the refused addition takes no number', () =>
    withRollback(async (tx) => {
      const { mine, only, staff } = await floor(tx)
      const open = await bill(tx, mine.id)
      // The waiter's screen read the bill as open; the pass cancels it before the send is written.
      expect(((await (await tabOf(mine.id, '4')).json()) as { data: { parent: { id: string } } }).data.parent.id).toBe(open.id)
      await tx.order.update({ where: { id: open.id }, data: { status: 'CANCELLED' } })

      const place = { restaurantId: mine.id, table: '4', serviceStart: serviceDayStart(new Date(), ZONE) }
      const line = { dishId: only.id, nameEn: 'Dish', nameFr: 'Plat', unitPrice: '9.50', quantity: 1, note: null }
      const stored = await storeOrder(
        { restaurantId: mine.id, table: '4', addTo: open.id, lines: [{ dishId: only.id, quantity: 1 }] },
        { staffId: staff.id, currency: null, lines: [line], place },
      )
      expect(stored).toEqual({ refused: 'cancelled' })
      expect(await tx.order.count({ where: { parentId: open.id } })).toBe(0)
      expect((await tx.restaurant.findUniqueOrThrow({ where: { id: mine.id }, select: { nextOrderNumber: true } })).nextOrderNumber).toBe(13)
    }))
})

describe('another restaurant’s tables', () => {
  it('are not read by a waiter or a manager of this one', () =>
    withRollback(async (tx) => {
      const { mine } = await floor(tx)
      const theirs = await restaurant(tx)
      await bill(tx, theirs.id)

      signInAs(await waiter(tx, [mine.id]))
      expect((await tabOf(theirs.id, '4')).status).toBe(403)
      signInAs(await manager(tx, [mine.id]))
      expect((await tabOf(theirs.id, '4')).status).toBe(403)
    }))

  it('have no bill this restaurant’s waiter can add to: another restaurant’s order reads as not found', () =>
    withRollback(async (tx) => {
      const { mine, only } = await floor(tx)
      const theirs = await restaurant(tx)
      const their = await bill(tx, theirs.id)
      const res = await post({ restaurantId: mine.id, table: '4', phone: '', addTo: their.id, lines: [{ dishId: only.id, quantity: 1 }] })
      expect(res.status).toBe(409)
      await expect(res.json()).resolves.toMatchObject({ details: { addTo: 'not_found' } })
      expect(await tx.order.count({ where: { parentId: their.id } })).toBe(0)
    }))
})
