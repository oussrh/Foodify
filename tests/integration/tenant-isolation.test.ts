import { describe, expect, it } from 'vitest'
import { deleteRestaurant, updateRestaurant } from '@/app/actions/restaurant-actions'
import { getMenu, reorderCategories } from '@/app/actions/menu-actions'
import { toggleDishStatus, updateDish } from '@/app/actions/dish-actions'
import { requireDishAccess, requireRestaurantAccess, requireSuperAdmin } from '@/lib/auth-guard'
import { withRollback } from './db'
import { category, dish, manager, restaurant, superAdmin } from './fixtures'
import { signInAs } from './session'

// The negative proof (DATA.3, AUTH.1): a restaurant admin reaches nothing of another
// restaurant, through the guards and through the actions, on the real database; a super admin
// reaches everything; nobody reaches anything signed out.
describe('tenant isolation', () => {
  it('a manager reads and writes their own restaurant and is refused on another', () =>
    withRollback(async (tx) => {
      const [mine, theirs] = await Promise.all([restaurant(tx), restaurant(tx)])
      const me = await manager(tx, [mine.id])
      const myDish = await dish(tx, mine.id)
      const theirDish = await dish(tx, theirs.id)
      signInAs(me)

      await expect(requireRestaurantAccess({ id: mine.id })).resolves.toMatchObject({ id: me.id })
      await expect(requireRestaurantAccess({ id: theirs.id })).rejects.toMatchObject({ status: 403 })
      await expect(requireRestaurantAccess({ slug: theirs.slug })).rejects.toMatchObject({ status: 403 })
      await expect(requireDishAccess(myDish.id)).resolves.toEqual({ restaurantId: mine.id })
      await expect(requireDishAccess(theirDish.id)).rejects.toMatchObject({ status: 403 })

      await expect(getMenu(mine.id)).resolves.toEqual([])
      await expect(getMenu(theirs.id)).rejects.toMatchObject({ status: 403 })
      await expect(toggleDishStatus(theirDish.id)).rejects.toMatchObject({ status: 403 })
      await expect(updateDish(theirDish.id, { nameEn: 'Taken over' })).rejects.toMatchObject({ status: 403 })
      await expect(updateRestaurant(theirs.id, { name: 'Taken over' })).rejects.toMatchObject({ status: 403 })
      // the rows are untouched
      expect(await tx.dish.findUnique({ where: { id: theirDish.id }, select: { nameEn: true } })).not.toMatchObject({ nameEn: 'Taken over' })
      expect(await tx.restaurant.findUnique({ where: { id: theirs.id }, select: { name: true } })).toMatchObject({ name: theirs.name })
    }))

  it('a reorder scoped to a restaurant moves none of another restaurant\'s categories, and says so', () =>
    withRollback(async (tx) => {
      const [mine, theirs] = await Promise.all([restaurant(tx), restaurant(tx)])
      const me = await manager(tx, [mine.id])
      const myCat = await category(tx, mine.id)
      const theirCat = await category(tx, theirs.id)
      signInAs(me)
      await expect(reorderCategories(mine.id, [theirCat.id, myCat.id])).resolves.toEqual({ count: 1 })
      expect(await tx.menuCategory.findUnique({ where: { id: theirCat.id }, select: { sortOrder: true } })).toEqual({ sortOrder: 0 })
      expect(await tx.menuCategory.findUnique({ where: { id: myCat.id }, select: { sortOrder: true } })).toEqual({ sortOrder: 1 })
    }))

  it('a manager is not a super admin: deleting a restaurant is refused even for their own', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      await expect(requireSuperAdmin()).rejects.toMatchObject({ status: 403 })
      await expect(deleteRestaurant(mine.id)).rejects.toMatchObject({ status: 403 })
      expect(await tx.restaurant.findUnique({ where: { id: mine.id }, select: { id: true } })).toEqual({ id: mine.id })
    }))

  it('a super admin reaches any restaurant; a signed-out caller reaches none', () =>
    withRollback(async (tx) => {
      const [a, b] = await Promise.all([restaurant(tx), restaurant(tx)])
      signInAs(await superAdmin(tx))
      await expect(requireRestaurantAccess({ id: a.id })).resolves.toBeTruthy()
      await expect(requireRestaurantAccess({ id: b.id })).resolves.toBeTruthy()
      await expect(deleteRestaurant(b.id)).resolves.toEqual({ id: b.id })
      signInAs(null)
      await expect(requireRestaurantAccess({ id: a.id })).rejects.toMatchObject({ status: 401 })
      await expect(getMenu(a.id)).rejects.toMatchObject({ status: 401 })
    }))

  it('a role change is seen by the next call, not by the token', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const me = await manager(tx, [mine.id])
      signInAs({ ...me, role: 'SUPER_ADMIN' }) // a token that still claims more than the row
      await expect(requireSuperAdmin()).rejects.toMatchObject({ status: 403 })
      await tx.user.update({ where: { id: me.id }, data: { role: 'SUPER_ADMIN' } })
      await expect(requireSuperAdmin()).resolves.toMatchObject({ id: me.id, role: 'SUPER_ADMIN' })
    }))
})
