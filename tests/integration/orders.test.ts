import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as placeOrder } from '@/app/api/orders/route'
import { withRollback, type Tx } from './db'
import { dish, restaurant } from './fixtures'

// The public ordering endpoint against the real database: what the guest sends is a list of ids
// and counts, and the row that comes out carries the prices the server read, the number taken
// from the restaurant's counter, and nothing a body could have set. The confirmation text is not
// exercised here: with no Brevo key `sendSms` sends nothing and says so, which is the point.

const post = (body: unknown) =>
  placeOrder(new NextRequest('http://test/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))

const takingOrders = (tx: Tx, id: string) => tx.restaurant.update({ where: { id }, data: { orderingEnabled: true }, select: { id: true } })

describe('POST /api/orders', () => {
  it('prices every line from the database, numbers the order and stores it with its lines', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await takingOrders(tx, mine.id)
      const chicken = await dish(tx, mine.id, { nameEn: 'Chicken' })
      const salad = await dish(tx, mine.id, { nameEn: 'Salad' })
      // The body carries no money: both dishes are 9.50 in the fixture.
      const res = await post({
        restaurantId: mine.id,
        table: ' 12 ',
        phone: '+212 600-11 22 33',
        note: 'Bring bread',
        lines: [{ dishId: chicken.id, quantity: 2, note: 'No onions' }, { dishId: salad.id, quantity: 1 }],
      })
      expect(res.status).toBe(201)
      const { data } = (await res.json()) as { data: { id: string; number: number; table: string; subtotal: string } }
      expect(data).toMatchObject({ number: 1, table: '12', subtotal: '28.50' })

      const row = await tx.order.findUniqueOrThrow({ where: { id: data.id }, include: { lines: { orderBy: { quantity: 'desc' } } } })
      expect(row.subtotal.toFixed(2)).toBe('28.50')
      expect(row.status).toBe('NEW')
      expect(row.note).toBe('Bring bread')
      // stored as it parses, the separators dropped
      expect(row.phone).toBe('+212600112233')
      expect(row.lines.map((l) => [l.nameEn, l.quantity, l.unitPrice.toFixed(2), l.note])).toEqual([
        ['Chicken', 2, '9.50', 'No onions'],
        ['Salad', 1, '9.50', null],
      ])
      expect((await tx.restaurant.findUniqueOrThrow({ where: { id: mine.id }, select: { nextOrderNumber: true } })).nextOrderNumber).toBe(2)
    }))

  it('numbers each order after the last one of that restaurant, and each restaurant from its own one', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      await takingOrders(tx, mine.id)
      await takingOrders(tx, theirs.id)
      const myDish = await dish(tx, mine.id)
      const theirDish = await dish(tx, theirs.id)
      const numberOf = async (res: Response) => ((await res.json()) as { data: { number: number } }).data.number
      expect(await numberOf(await post({ restaurantId: mine.id, table: '1', phone: '0600112233', lines: [{ dishId: myDish.id, quantity: 1 }] }))).toBe(1)
      expect(await numberOf(await post({ restaurantId: mine.id, table: '2', phone: '0600112233', lines: [{ dishId: myDish.id, quantity: 1 }] }))).toBe(2)
      expect(await numberOf(await post({ restaurantId: theirs.id, table: '1', phone: '0600112233', lines: [{ dishId: theirDish.id, quantity: 1 }] }))).toBe(1)
    }))

  it('refuses a restaurant that is not taking orders, and writes nothing', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const only = await dish(tx, mine.id)
      const res = await post({ restaurantId: mine.id, table: '3', phone: '0600112233', lines: [{ dishId: only.id, quantity: 1 }] })
      expect(res.status).toBe(403)
      await expect(res.json()).resolves.toMatchObject({ code: 'forbidden' })
      expect(await tx.order.count({ where: { restaurantId: mine.id } })).toBe(0)
    }))

  it('refuses a dish of another restaurant and one that is not active, naming neither', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      await takingOrders(tx, mine.id)
      const theirDish = await dish(tx, theirs.id)
      const hidden = await dish(tx, mine.id)
      await tx.dish.update({ where: { id: hidden.id }, data: { isActive: false } })
      for (const dishId of [theirDish.id, hidden.id]) {
        const res = await post({ restaurantId: mine.id, table: '3', phone: '0600112233', lines: [{ dishId, quantity: 1 }] })
        expect(res.status).toBe(400)
        await expect(res.json()).resolves.toMatchObject({ code: 'invalid_payload' })
      }
      expect(await tx.order.count({ where: { restaurantId: mine.id } })).toBe(0)
    }))

  it('refuses an unknown restaurant, an empty order and a body that is not JSON', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await takingOrders(tx, mine.id)
      const unknown = await post({ restaurantId: '11111111-1111-4111-8111-111111111111', table: '1', phone: '0600112233', lines: [{ dishId: (await dish(tx, mine.id)).id, quantity: 1 }] })
      expect(unknown.status).toBe(404)
      const empty = await post({ restaurantId: mine.id, table: '1', phone: '0600112233', lines: [] })
      expect(empty.status).toBe(400)
      const noPhone = await post({ restaurantId: mine.id, table: '1', lines: [{ dishId: (await dish(tx, mine.id)).id, quantity: 1 }] })
      expect(noPhone.status).toBe(400)
      const notJson = await placeOrder(new NextRequest('http://test/api/orders', { method: 'POST', body: 'nope' }))
      expect(notJson.status).toBe(400)
      await expect(notJson.json()).resolves.toMatchObject({ code: 'invalid_json' })
    }))
})
