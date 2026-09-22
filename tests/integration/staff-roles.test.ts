import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as boardOrders } from '@/app/api/orders/board/route'
import { POST as placeOrder } from '@/app/api/orders/route'
import { setOrderStatus } from '@/app/actions/order-actions'
import { updateRestaurant } from '@/app/actions/restaurant-actions'
import { createDish } from '@/app/actions/dish-actions'
import { withRollback, type Tx } from './db'
import { dish, kitchenTablet, manager, restaurant, waiter } from './fixtures'
import { signInAs } from './session'

// The two accounts that are not people with portals. What matters here is what they CANNOT do: a
// tablet and a waiter are assigned to a restaurant, and that assignment must never become a write.

const board = (restaurantId: string) => boardOrders(new Request(`http://test/api/orders/board?restaurantId=${restaurantId}`))

const post = (body: unknown) =>
  placeOrder(new NextRequest('http://test/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))

async function openOrder(tx: Tx, restaurantId: string) {
  const dishRow = await dish(tx, restaurantId)
  return tx.order.create({
    data: {
      restaurantId,
      number: 1,
      table: '3',
      phone: '+212600112233',
      subtotal: '9.50',
      lines: { create: [{ dishId: dishRow.id, nameEn: 'Chicken', nameFr: 'Poulet', unitPrice: '9.50', quantity: 1 }] },
    },
    select: { id: true },
  })
}

const takingOrders = (tx: Tx, id: string) => tx.restaurant.update({ where: { id }, data: { orderingEnabled: true }, select: { id: true } })

describe('an order tablet', () => {
  it('reads and moves its own restaurant\'s orders', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const order = await openOrder(tx, mine.id)
      signInAs(await kitchenTablet(tx, [mine.id]))
      expect((await board(mine.id)).status).toBe(200)
      expect(await setOrderStatus({ orderId: order.id, action: 'accept' })).toMatchObject({ status: 'ACCEPTED' })
    }))

  it('cannot write anything else about the restaurant it is assigned to', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await kitchenTablet(tx, [mine.id]))
      // Being assigned is what makes this worth testing: the guard, not the membership, is the gate.
      await expect(updateRestaurant(mine.id, { name: 'Renamed by a tablet' })).rejects.toThrow()
      await expect(createDish(mine.id, { nameEn: 'X', nameFr: 'X', price: '1.00', imageUrl: '/x.jpg' })).rejects.toThrow()
      expect((await tx.restaurant.findUniqueOrThrow({ where: { id: mine.id }, select: { name: true } })).name).toBe(mine.name)
    }))

  it('cannot place an order: it cooks what comes in', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await takingOrders(tx, mine.id)
      const only = await dish(tx, mine.id)
      signInAs(await kitchenTablet(tx, [mine.id]))
      // Refused as staff, so it falls back to the guest rules, which want a phone.
      expect((await post({ restaurantId: mine.id, table: '4', lines: [{ dishId: only.id, quantity: 1 }] })).status).toBe(400)
    }))
})

describe('a waiter', () => {
  it('places an order for a table with no phone, and the order records who took it', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await takingOrders(tx, mine.id)
      const only = await dish(tx, mine.id)
      const staff = await waiter(tx, [mine.id])
      signInAs(staff)

      // The app sends `phone: ''`, not a missing key: a form with nothing typed in it has a value.
      // Omitting it here is what let a shape that refused '' pass this test while refusing every
      // order a waiter actually placed.
      const res = await post({ restaurantId: mine.id, table: '7', phone: '', lines: [{ dishId: only.id, quantity: 2 }] })
      expect(res.status).toBe(201)
      const { data } = (await res.json()) as { data: { id: string } }
      const row = await tx.order.findUniqueOrThrow({ where: { id: data.id }, select: { phone: true, placedById: true, table: true, subtotal: true } })
      expect(row).toMatchObject({ phone: '', placedById: staff.id, table: '7' })
      expect(row.subtotal.toFixed(2)).toBe('19.00')
    }))

  it('reads the board, and moves an order only by carrying it out', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const order = await openOrder(tx, mine.id)
      signInAs(await waiter(tx, [mine.id]))
      expect((await board(mine.id)).status).toBe(200)

      // The kitchen's own moves stay the kitchen's: a waiter does not start a dish or call it up.
      await expect(setOrderStatus({ orderId: order.id, action: 'accept' })).rejects.toThrow()
      await expect(setOrderStatus({ orderId: order.id, action: 'ready' })).rejects.toThrow()
      await expect(setOrderStatus({ orderId: order.id, action: 'cancel' })).rejects.toThrow()
      expect((await tx.order.findUniqueOrThrow({ where: { id: order.id }, select: { status: true } })).status).toBe('NEW')

      // Carrying it to the table is the floor's move, and the only one.
      await expect(setOrderStatus({ orderId: order.id, action: 'done' })).resolves.toMatchObject({ status: 'DONE' })
    }))

  it('is told by the kitchen calling an order up, which is what the phone announces', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const order = await openOrder(tx, mine.id)

      signInAs(await kitchenTablet(tx, [mine.id]))
      await expect(setOrderStatus({ orderId: order.id, action: 'ready' })).resolves.toMatchObject({ status: 'READY' })
      const row = await tx.order.findUniqueOrThrow({ where: { id: order.id }, select: { readyAt: true, servedAt: true } })
      // Ready is stamped; served is not, because nobody has carried it yet.
      expect(row.readyAt).not.toBeNull()
      expect(row.servedAt).toBeNull()

      // And it is still open, so it stays on the board and on the waiter's phone until carried.
      signInAs(await waiter(tx, [mine.id]))
      const shown = await (await board(mine.id)).json()
      expect((shown as { data: { id: string; status: string }[] }).data.some((o) => o.id === order.id && o.status === 'READY')).toBe(true)
    }))

  it('cannot write anything about the restaurant, and cannot order for another one', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      await takingOrders(tx, theirs.id)
      const theirDish = await dish(tx, theirs.id)
      signInAs(await waiter(tx, [mine.id]))
      await expect(updateRestaurant(mine.id, { name: 'Renamed by a waiter' })).rejects.toThrow()
      // Not their restaurant: they fall back to the guest rules, which want a phone.
      expect((await post({ restaurantId: theirs.id, table: '1', lines: [{ dishId: theirDish.id, quantity: 1 }] })).status).toBe(400)
      expect((await board(theirs.id)).status).toBe(403)
    }))
})

describe('a manager', () => {
  it('may also take an order at the table, and it is recorded against them', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await takingOrders(tx, mine.id)
      const only = await dish(tx, mine.id)
      const boss = await manager(tx, [mine.id])
      signInAs(boss)
      const res = await post({ restaurantId: mine.id, table: '2', lines: [{ dishId: only.id, quantity: 1 }] })
      expect(res.status).toBe(201)
      const { data } = (await res.json()) as { data: { id: string } }
      expect((await tx.order.findUniqueOrThrow({ where: { id: data.id }, select: { placedById: true } })).placedById).toBe(boss.id)
    }))
})
