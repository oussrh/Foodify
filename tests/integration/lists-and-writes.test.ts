import { describe, expect, it } from 'vitest'
import { createDish, updateDish } from '@/app/actions/dish-actions'
import { createCategory } from '@/app/actions/menu-actions'
import { afterCursor, page, pageArgs } from '@/lib/schemas/list'
import { withRollback } from './db'
import { manager, restaurant, superAdmin } from './fixtures'
import { signInAs } from './session'

// What the unit tests cannot see: the database's constraints, the money column, a keyset page
// over real rows, and the row a write leaves behind.
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

  it('pages restaurants by keyset in name order, and never skips or repeats a row', () =>
    withRollback(async (tx) => {
      signInAs(await superAdmin(tx))
      const prefix = `Page ${Math.random().toString(36).slice(2, 8)}`
      for (const suffix of ['b', 'a', 'c', 'a']) await restaurant(tx, `${prefix} ${suffix}`)
      const where = { name: { startsWith: prefix } }
      const seen: string[] = []
      let cursor: string | undefined
      for (let pages = 0; pages < 5; pages++) {
        const rows = await tx.restaurant.findMany({ where: { ...where, ...afterCursor('name', cursor) }, select: { id: true, name: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }], ...pageArgs({ limit: 2, cursor }) })
        const p = page(rows, 2, 'name')
        seen.push(...p.data.map((r) => r.name))
        if (!p.next) break
        cursor = p.next
      }
      expect(seen).toEqual([`${prefix} a`, `${prefix} a`, `${prefix} b`, `${prefix} c`])
    }))
})
