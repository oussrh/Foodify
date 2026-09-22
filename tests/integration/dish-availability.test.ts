import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { setDishAvailability } from '@/app/actions/dish-availability-actions'
import { POST as placeOrder } from '@/app/api/orders/route'
import { withRollback, type Tx } from './db'
import { dish, kitchenTablet, manager, restaurant, waiter } from './fixtures'
import { signInAs } from './session'

// Marking a dish sold out is the one write a device account has over the menu, so the population
// it is open to is the point: everyone who works the service, and nobody else. The other half is
// that the refusal reaches the order endpoint, not only the menu's add button — a cart is built
// in the guest's browser and can be older than the dish's availability.

const post = (body: unknown) =>
  placeOrder(
    new NextRequest('http://test/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )

const takingOrders = (tx: Tx, id: string) =>
  tx.restaurant.update({ where: { id }, data: { orderingEnabled: true }, select: { id: true } })

const soldOutUntilOf = async (tx: Tx, id: string) =>
  (await tx.dish.findUniqueOrThrow({ where: { id }, select: { soldOutUntil: true } })).soldOutUntil

describe('marking a dish sold out', () => {
  it('is open to everyone who works the service', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const d = await dish(tx, mine.id)

      for (const account of [await manager(tx, [mine.id]), await kitchenTablet(tx, [mine.id]), await waiter(tx, [mine.id])]) {
        signInAs(account)
        await expect(setDishAvailability(d.id, { soldOut: true })).resolves.toMatchObject({ soldOut: true })
        await expect(setDishAvailability(d.id, { soldOut: false })).resolves.toMatchObject({ soldOut: false })
      }
    }))

  it('stamps a moment in the future and clears it back to null', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const d = await dish(tx, mine.id)
      signInAs(await manager(tx, [mine.id]))

      await setDishAvailability(d.id, { soldOut: true })
      const until = await soldOutUntilOf(tx, d.id)
      expect(until).not.toBeNull()
      expect(until!.getTime()).toBeGreaterThan(Date.now())

      await setDishAvailability(d.id, { soldOut: false })
      expect(await soldOutUntilOf(tx, d.id)).toBeNull()
    }))

  it('is refused to another restaurant, and to nobody', () =>
    withRollback(async (tx) => {
      const theirs = await restaurant(tx)
      const mine = await restaurant(tx)
      const theirDish = await dish(tx, theirs.id)

      signInAs(await manager(tx, [mine.id]))
      await expect(setDishAvailability(theirDish.id, { soldOut: true })).rejects.toThrow()
      expect(await soldOutUntilOf(tx, theirDish.id)).toBeNull()
    }))

  it('leaves everything else about the dish alone: it is the only menu write a device has', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const d = await tx.dish.findUniqueOrThrow({ where: { id: (await dish(tx, mine.id)).id } })
      signInAs(await kitchenTablet(tx, [mine.id]))

      await setDishAvailability(d.id, { soldOut: true })

      const after = await tx.dish.findUniqueOrThrow({ where: { id: d.id } })
      expect({ ...after, soldOutUntil: null }).toEqual({ ...d, soldOutUntil: null })
    }))
})

describe('ordering a dish that is sold out', () => {
  it('is refused by the endpoint, not only hidden from the menu', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await takingOrders(tx, mine.id)
      const d = await dish(tx, mine.id)
      signInAs(await manager(tx, [mine.id]))
      await setDishAvailability(d.id, { soldOut: true })

      const body = { restaurantId: mine.id, table: '4', phone: '+212600112233', locale: 'en', lines: [{ dishId: d.id, quantity: 1 }] }
      const res = await post(body)

      expect(res.status).toBe(400)
      expect(await tx.order.count({ where: { restaurantId: mine.id } })).toBe(0)
    }))

  it('is taken again once the dish comes back', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      await takingOrders(tx, mine.id)
      const d = await dish(tx, mine.id)
      // A moment already passed: the dish is available again with nothing having run.
      await tx.dish.update({ where: { id: d.id }, data: { soldOutUntil: new Date('2020-01-01T00:00:00Z') } })

      const body = { restaurantId: mine.id, table: '4', phone: '+212600112233', locale: 'en', lines: [{ dishId: d.id, quantity: 1 }] }
      const res = await post(body)

      expect(res.status).toBe(201)
    }))
})
