import { describe, expect, it } from 'vitest'
import { GET as listRestaurants } from '@/app/api/restaurants/route'
import { createDish, updateDish } from '@/app/actions/dish-actions'
import { createCategory } from '@/app/actions/menu-actions'
import { newRestaurantCode } from '@/lib/restaurant-code'
import { withRollback } from './db'
import { manager, restaurant, superAdmin } from './fixtures'
import { signInAs } from './session'

// What the unit tests cannot see: the money column as Postgres stores it, the row a write
// leaves behind, and the admin list's keyset page over real rows through its own handler. A
// constraint violation would abort the transaction every test runs in, so the schema's
// refusals are tested (they happen first) and a constraint's are left to the migrations.
describe('writes on the real database', () => {
  it('stores a dish with its price exact, and answers the shaped payload only', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      const created = await createDish(mine.id, { nameEn: 'Tagine', nameFr: 'Tajine', price: '12.5', imageUrl: '/t.jpg', dietary: ['halal'] })
      expect(created).toEqual({ id: expect.any(String), isActive: true, isMostPurchased: false })
      const row = await tx.dish.findUniqueOrThrow({ where: { id: created.id } })
      expect(row.price.toFixed(2)).toBe('12.50')
      expect(row.restaurantId).toBe(mine.id)
      expect(row.sortOrder).toBe(0)
      await expect(updateDish(created.id, { price: '0.1', isActive: false })).resolves.toEqual({ id: created.id, isActive: false, isMostPurchased: false })
      expect((await tx.dish.findUniqueOrThrow({ where: { id: created.id } })).price.toFixed(2)).toBe('0.10')
    }))

  it('keeps a dish to the dietary tags its restaurant offers, on create and on update, and a new restaurant offers them all', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx, undefined, { dietaryOptions: ['vegan'] })
      signInAs(await manager(tx, [mine.id]))
      const created = await createDish(mine.id, { nameEn: 'Salad', nameFr: 'Salade', price: '8.00', imageUrl: '/s.jpg', dietary: ['halal', 'vegan'] })
      expect((await tx.dish.findUniqueOrThrow({ where: { id: created.id } })).dietary).toEqual(['vegan'])
      await updateDish(created.id, { dietary: ['spicy', 'vegan', 'halal'] })
      expect((await tx.dish.findUniqueOrThrow({ where: { id: created.id } })).dietary).toEqual(['vegan'])
      const fresh = await tx.restaurant.create({
        data: { name: 'Fresh', slug: `fresh-${created.id.slice(0, 8)}`, code: newRestaurantCode(), defaultLocale: 'en' },
        select: { dietaryOptions: true },
      })
      expect(fresh.dietaryOptions).toEqual(['vegetarian', 'vegan', 'halal', 'gluten_free', 'spicy'])
    }))

  it('refuses a dish whose price is not a decimal string before the database sees it', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      await expect(createDish(mine.id, { nameEn: 'X', nameFr: 'X', price: '12.345', imageUrl: '/x.jpg' })).rejects.toThrow(/two decimals/)
      expect(await tx.dish.count({ where: { restaurantId: mine.id } })).toBe(0)
    }))

  it('numbers a new category after the last one of its restaurant', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      const first = await createCategory(mine.id, { nameEn: 'Starters', nameFr: 'Entrées' })
      const second = await createCategory(mine.id, { nameEn: 'Mains', nameFr: 'Plats' })
      expect([first.sortOrder, second.sortOrder]).toEqual([0, 1])
      expect(first).toMatchObject({ isActive: true, nameFr: 'Entrées' })
    }))

  it('pages the restaurants list by keyset through its handler, in name order, and never skips or repeats a row', () =>
    withRollback(async (tx) => {
      signInAs(await superAdmin(tx))
      const prefix = 'Page test'
      for (const suffix of ['b', 'a', 'c', 'a']) await restaurant(tx, `${prefix} ${suffix}`)
      const seen: string[] = []
      let cursor: string | null = null
      for (let pages = 0; pages < 6; pages++) {
        const url = `http://test/api/restaurants?limit=2${cursor ? `&cursor=${cursor}` : ''}`
        const res = await listRestaurants(new Request(url))
        expect(res.status).toBe(200)
        const body = (await res.json()) as { data: { name: string }[]; meta: { next: string | null } }
        seen.push(...body.data.map((r) => r.name).filter((n) => n.startsWith(prefix)))
        cursor = body.meta.next
        if (!cursor) break
      }
      expect(seen).toEqual([`${prefix} a`, `${prefix} a`, `${prefix} b`, `${prefix} c`])
    }))

  it('refuses the list to a manager with the envelope\'s forbidden code', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      const res = await listRestaurants(new Request('http://test/api/restaurants'))
      expect(res.status).toBe(403)
      await expect(res.json()).resolves.toMatchObject({ code: 'forbidden' })
    }))
})
