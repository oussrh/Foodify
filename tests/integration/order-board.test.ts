import { describe, expect, it } from 'vitest'
import { GET as boardOrders } from '@/app/api/orders/board/route'
import { setOrderStatus } from '@/app/actions/order-actions'
import type { BoardOrder } from '@/lib/orders'
import { withRollback, type Tx } from './db'
import { dish, manager, restaurant, superAdmin } from './fixtures'
import { signInAs } from './session'

// The kitchen board against the real database: who may read a restaurant's orders and act on
// them, what the board sees, and the statuses an action may and may not move.

const board = (restaurantId: string, status?: string[]) => {
  const query = new URLSearchParams({ restaurantId })
  for (const s of status ?? []) query.append('status', s)
  return boardOrders(new Request(`http://test/api/orders/board?${query.toString()}`))
}

const ordersOf = async (res: Response) => ((await res.json()) as { data: BoardOrder[] }).data

async function order(tx: Tx, restaurantId: string, number: number, extra: { status?: 'NEW' | 'ACCEPTED' | 'DONE'; table?: string; minutesAgo?: number } = {}) {
  const dishRow = await dish(tx, restaurantId)
  return tx.order.create({
    data: {
      restaurantId,
      number,
      table: extra.table ?? String(number),
      phone: '+212600112233',
      subtotal: '9.50',
      status: extra.status ?? 'NEW',
      createdAt: new Date(Date.now() - (extra.minutesAgo ?? 0) * 60_000),
      lines: { create: [{ dishId: dishRow.id, nameEn: 'Chicken', nameFr: 'Poulet', unitPrice: '9.50', quantity: 1, note: 'No onions' }] },
    },
    select: { id: true },
  })
}

describe('GET /api/orders/board', () => {
  it('answers the restaurant\'s open orders, oldest first, with their lines', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      await order(tx, mine.id, 1, { minutesAgo: 2 })
      await order(tx, mine.id, 2, { minutesAgo: 9, status: 'ACCEPTED' })
      await order(tx, mine.id, 3, { status: 'DONE' })

      const rows = await ordersOf(await board(mine.id))
      expect(rows.map((o) => o.number)).toEqual([2, 1])
      expect(rows[0]).toMatchObject({ table: '2', phone: '+212600112233', status: 'ACCEPTED', subtotal: '9.50' })
      expect(rows[0]?.lines).toEqual([{ id: expect.any(String), nameEn: 'Chicken', nameFr: 'Poulet', quantity: 1, removedQuantity: 0, note: 'No onions' }])
      expect(typeof rows[0]?.createdAt).toBe('string')
    }))

  it('shows the finished ones when asked for them by name, newest served first', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      await order(tx, mine.id, 1)
      const first = await order(tx, mine.id, 2, { status: 'DONE' })
      const second = await order(tx, mine.id, 3, { status: 'DONE' })
      // Stated, not timed: two updates in one transaction can land in the same millisecond, and a
      // test that leans on the clock to separate them proves whatever the clock happened to do.
      await tx.order.update({ where: { id: first.id }, data: { servedAt: new Date('2026-09-22T12:00:00Z') } })
      await tx.order.update({ where: { id: second.id }, data: { servedAt: new Date('2026-09-22T12:30:00Z') } })

      const served = await ordersOf(await board(mine.id, ['DONE']))

      expect(served.map((o) => o.number)).toEqual([3, 2])
      expect(served.every((o) => o.status === 'DONE')).toBe(true)
    }))

  it('reads the finished ones by when they were served, not by when they were last touched', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      const early = await order(tx, mine.id, 1, { status: 'DONE' })
      const late = await order(tx, mine.id, 2, { status: 'DONE' })
      await tx.order.update({ where: { id: early.id }, data: { servedAt: new Date('2026-09-22T12:00:00Z') } })
      await tx.order.update({ where: { id: late.id }, data: { servedAt: new Date('2026-09-22T12:30:00Z') } })
      // Touching the older one after the fact moves `updatedAt` and nothing else: it did not go
      // out of the kitchen again, so it must not climb over the one served after it.
      await tx.order.update({ where: { id: early.id }, data: { note: 'allergy noted late' } })

      const served = await ordersOf(await board(mine.id, ['DONE']))

      expect(served.map((o) => o.number)).toEqual([2, 1])
    }))

  it('keeps two orders served in the same millisecond in the order they were taken', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      const together = new Date('2026-09-22T12:00:00Z')
      const first = await order(tx, mine.id, 7, { status: 'DONE' })
      const second = await order(tx, mine.id, 8, { status: 'DONE' })
      await tx.order.update({ where: { id: first.id }, data: { servedAt: together } })
      await tx.order.update({ where: { id: second.id }, data: { servedAt: together } })

      const served = await ordersOf(await board(mine.id, ['DONE']))

      // A tie is settled by the order number, which counts up. Settling it by a random uuid read
      // either way round and could swap between two polls five seconds apart.
      expect(served.map((o) => o.number)).toEqual([8, 7])
    }))

  it('never shows another restaurant\'s orders, and refuses a manager who is not this one\'s', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      await order(tx, theirs.id, 1)
      signInAs(await manager(tx, [mine.id]))
      expect(await ordersOf(await board(mine.id))).toEqual([])
      const refused = await board(theirs.id)
      expect(refused.status).toBe(403)
      await expect(refused.json()).resolves.toMatchObject({ code: 'forbidden' })
    }))

  it('refuses a signed-out caller and a query that is not one', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(null)
      expect((await board(mine.id)).status).toBe(401)
      signInAs(await superAdmin(tx))
      expect((await board('not-a-uuid')).status).toBe(400)
      expect((await board(mine.id, ['COOKING'])).status).toBe(400)
    }))
})

describe('setOrderStatus', () => {
  it('stamps the moment of each move, and only of the move that caused it', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      const row = await order(tx, mine.id, 1, { minutesAgo: 10 })
      const stamps = () => tx.order.findUniqueOrThrow({ where: { id: row.id }, select: { acceptedAt: true, servedAt: true, createdAt: true } })

      expect(await stamps()).toMatchObject({ acceptedAt: null, servedAt: null })
      await setOrderStatus({ orderId: row.id, action: 'accept' })
      const started = await stamps()
      expect(started.acceptedAt).toBeInstanceOf(Date)
      expect(started.servedAt).toBeNull()
      // The order was placed ten minutes ago, so the wait before the start is measurable.
      expect(started.acceptedAt!.getTime()).toBeGreaterThan(started.createdAt.getTime())

      await setOrderStatus({ orderId: row.id, action: 'done' })
      const served = await stamps()
      expect(served.servedAt).toBeInstanceOf(Date)
      // Serving does not move the moment the order was taken on.
      expect(served.acceptedAt?.getTime()).toBe(started.acceptedAt?.getTime())
    }))

  it('takes an order on, serves it, and leaves a move that does not apply alone', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      const row = await order(tx, mine.id, 1)

      expect(await setOrderStatus({ orderId: row.id, action: 'accept' })).toEqual({ id: row.id, status: 'ACCEPTED' })
      // Already taken on: the second press changes nothing and says where it stands.
      expect(await setOrderStatus({ orderId: row.id, action: 'accept' })).toEqual({ id: row.id, status: 'ACCEPTED' })
      expect(await setOrderStatus({ orderId: row.id, action: 'done' })).toEqual({ id: row.id, status: 'DONE' })
      // A served order cannot be cancelled back.
      expect(await setOrderStatus({ orderId: row.id, action: 'cancel' })).toEqual({ id: row.id, status: 'DONE' })
      expect((await tx.order.findUniqueOrThrow({ where: { id: row.id }, select: { status: true } })).status).toBe('DONE')
    }))

  it('refuses an order of another restaurant, and one that does not exist, without changing it', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      const foreign = await order(tx, theirs.id, 1)
      signInAs(await manager(tx, [mine.id]))
      await expect(setOrderStatus({ orderId: foreign.id, action: 'done' })).rejects.toThrow('Forbidden')
      expect((await tx.order.findUniqueOrThrow({ where: { id: foreign.id }, select: { status: true } })).status).toBe('NEW')
      // One that does not exist is refused the same way, so an id cannot be probed.
      await expect(setOrderStatus({ orderId: '11111111-1111-4111-8111-111111111111', action: 'done' })).rejects.toThrow('Forbidden')
    }))
})
