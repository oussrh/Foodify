import { describe, expect, it } from 'vitest'
import { deleteRestaurant, updateRestaurant } from '@/app/actions/restaurant-actions'
import { getMenu, reorderCategories, updateCategory, updateSubcategory } from '@/app/actions/menu-actions'
import { createDish, toggleDishStatus, updateDish, updateIngredient } from '@/app/actions/dish-actions'
import {
  requireBoardAccess,
  requireCategoryAccess,
  requireDishAccess,
  requireIngredientAccess,
  requireOrderingStaff,
  requireRestaurantAccess,
  requireSubcategoryAccess,
  requireSuperAdmin,
} from '@/lib/auth-guard'
import { loadMenu } from '@/lib/menu-loader'
import { setMfaEnabled } from '@/app/actions/profile-actions'
import { withRollback, type Tx } from './db'
import { category, dish, ingredient, kitchenTablet, manager, restaurant, subcategory, superAdmin, waiter } from './fixtures'
import { signInAs } from './session'

// The negative proof (DATA.3, AUTH.1): a restaurant admin reaches nothing of another
// restaurant, through every guard and through the actions, on the real database; a super admin
// reaches everything; nobody reaches anything signed out.
const forbidden = { status: 403 }

async function twoRestaurants(tx: Tx) {
  const [mine, theirs] = await Promise.all([restaurant(tx), restaurant(tx)])
  const me = await manager(tx, [mine.id])
  signInAs(me)
  return { mine, theirs, me }
}

describe('tenant isolation: the guards', () => {
  it('grants a manager their restaurant by id and by slug and refuses another', () =>
    withRollback(async (tx) => {
      const { mine, theirs, me } = await twoRestaurants(tx)
      await expect(requireRestaurantAccess({ id: mine.id })).resolves.toMatchObject({ id: me.id })
      await expect(requireRestaurantAccess({ slug: mine.slug })).resolves.toMatchObject({ id: me.id })
      await expect(requireRestaurantAccess({ id: theirs.id })).rejects.toMatchObject(forbidden)
      await expect(requireRestaurantAccess({ slug: theirs.slug })).rejects.toMatchObject(forbidden)
    }))

  it('grants a dish, a category, a subcategory and an ingredient of the restaurant and refuses those of another', () =>
    withRollback(async (tx) => {
      const { mine, theirs } = await twoRestaurants(tx)
      const [myDish, theirDish, myCat, theirCat] = await Promise.all([dish(tx, mine.id), dish(tx, theirs.id), category(tx, mine.id), category(tx, theirs.id)])
      const [mySub, theirSub, myIng, theirIng] = await Promise.all([subcategory(tx, myCat.id), subcategory(tx, theirCat.id), ingredient(tx, myDish.id), ingredient(tx, theirDish.id)])
      await expect(requireDishAccess(myDish.id)).resolves.toEqual({ restaurantId: mine.id })
      await expect(requireDishAccess(theirDish.id)).rejects.toMatchObject(forbidden)
      await expect(requireCategoryAccess(myCat.id)).resolves.toBeTruthy()
      await expect(requireCategoryAccess(theirCat.id)).rejects.toMatchObject(forbidden)
      await expect(requireSubcategoryAccess(mySub.id)).resolves.toBeTruthy()
      await expect(requireSubcategoryAccess(theirSub.id)).rejects.toMatchObject(forbidden)
      await expect(requireIngredientAccess(myIng.id)).resolves.toBeTruthy()
      await expect(requireIngredientAccess(theirIng.id)).rejects.toMatchObject(forbidden)
    }))

  it('is not fooled by a token that claims more than the row: the role is read fresh on every call', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const me = await manager(tx, [mine.id])
      signInAs({ ...me, role: 'SUPER_ADMIN' })
      await expect(requireSuperAdmin()).rejects.toMatchObject(forbidden)
      await tx.user.update({ where: { id: me.id }, data: { role: 'SUPER_ADMIN' } })
      await expect(requireSuperAdmin()).resolves.toMatchObject({ id: me.id, role: 'SUPER_ADMIN' })
    }))

  it('grants a super admin any restaurant and a signed-out caller none', () =>
    withRollback(async (tx) => {
      const [a, b] = await Promise.all([restaurant(tx), restaurant(tx)])
      signInAs(await superAdmin(tx))
      await expect(requireRestaurantAccess({ id: a.id })).resolves.toBeTruthy()
      await expect(requireRestaurantAccess({ id: b.id })).resolves.toBeTruthy()
      signInAs(null)
      await expect(requireRestaurantAccess({ id: a.id })).rejects.toMatchObject({ status: 401 })
      await expect(requireSuperAdmin()).rejects.toMatchObject({ status: 401 })
    }))
})

describe('tenant isolation: the actions', () => {
  it("refuses a read and every write on another restaurant's rows, which stay as they were", () =>
    withRollback(async (tx) => {
      const { theirs } = await twoRestaurants(tx)
      const theirDish = await dish(tx, theirs.id)
      const theirCat = await category(tx, theirs.id)
      const theirSub = await subcategory(tx, theirCat.id)
      const theirIng = await ingredient(tx, theirDish.id)
      await expect(getMenu(theirs.id)).rejects.toMatchObject(forbidden)
      await expect(toggleDishStatus(theirDish.id)).rejects.toMatchObject(forbidden)
      await expect(updateDish(theirDish.id, { nameEn: 'Taken over' })).rejects.toMatchObject(forbidden)
      await expect(updateCategory(theirCat.id, { nameEn: 'Taken over' })).rejects.toMatchObject(forbidden)
      await expect(updateSubcategory(theirSub.id, { nameEn: 'Taken over' })).rejects.toMatchObject(forbidden)
      await expect(updateIngredient(theirIng.id, { nameEn: 'Taken over' })).rejects.toMatchObject(forbidden)
      await expect(updateRestaurant(theirs.id, { name: 'Taken over' })).rejects.toMatchObject(forbidden)
      const taken = await tx.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM "Dish" WHERE "nameEn" = 'Taken over'`
      expect(Number(taken[0]?.n)).toBe(0)
      expect(await tx.restaurant.findUnique({ where: { id: theirs.id }, select: { name: true } })).toMatchObject({ name: theirs.name })
    }))

  it("cannot place a dish under another restaurant's subcategory, and that restaurant's public menu never shows it", () =>
    withRollback(async (tx) => {
      const { mine, theirs } = await twoRestaurants(tx)
      const theirCat = await category(tx, theirs.id)
      const theirSub = await subcategory(tx, theirCat.id)
      const myDish = await dish(tx, mine.id)
      const input = { nameEn: 'Cuckoo', nameFr: 'Coucou', price: '1.00', imageUrl: '/c.jpg', subcategoryId: theirSub.id }
      await expect(createDish(mine.id, input)).rejects.toMatchObject(forbidden)
      await expect(updateDish(myDish.id, { subcategoryId: theirSub.id })).rejects.toMatchObject(forbidden)
      expect(await tx.dish.count({ where: { subcategoryId: theirSub.id } })).toBe(0)
      // even a row written past the action (a direct write) is not the other menu's to show
      await tx.dish.update({ where: { id: myDish.id }, data: { subcategoryId: theirSub.id } })
      const menu = await loadMenu(theirs.slug)
      const shown = menu?.restaurant.categories.flatMap((c) => c.subcategories.flatMap((s) => s.dishes.map((d) => d.id))) ?? []
      expect(shown).not.toContain(myDish.id)
    }))

  it("moves none of another restaurant's categories in a reorder, and counts only its own", () =>
    withRollback(async (tx) => {
      const { mine, theirs } = await twoRestaurants(tx)
      const myCat = await category(tx, mine.id, 0)
      const theirCat = await category(tx, theirs.id, 5)
      await expect(reorderCategories(mine.id, [myCat.id, theirCat.id])).resolves.toEqual({ count: 1 })
      expect(await tx.menuCategory.findUnique({ where: { id: theirCat.id }, select: { sortOrder: true } })).toEqual({ sortOrder: 5 })
      expect(await tx.menuCategory.findUnique({ where: { id: myCat.id }, select: { sortOrder: true } })).toEqual({ sortOrder: 0 })
    }))

  it('refuses a manager the delete of their own restaurant, and lets a super admin delete any', () =>
    withRollback(async (tx) => {
      const { mine } = await twoRestaurants(tx)
      await expect(deleteRestaurant(mine.id)).rejects.toMatchObject(forbidden)
      expect(await tx.restaurant.findUnique({ where: { id: mine.id }, select: { id: true } })).toEqual({ id: mine.id })
      signInAs(await superAdmin(tx))
      await expect(deleteRestaurant(mine.id)).resolves.toEqual({ id: mine.id })
      expect(await tx.restaurant.findUnique({ where: { id: mine.id } })).toBeNull()
    }))
})

// The device accounts are assigned to a restaurant like a manager is, which is exactly why they
// are worth proving here: membership is not permission, and the guard is the only thing between
// a tablet on a counter and the menu it is standing next to.
describe('tenant isolation: the device accounts', () => {
  it('lets a tablet and a waiter read the board of their own restaurant and no other', () =>
    withRollback(async (tx) => {
      const [mine, theirs] = await Promise.all([restaurant(tx), restaurant(tx)])

      signInAs(await kitchenTablet(tx, [mine.id]))
      await expect(requireBoardAccess(mine.id)).resolves.toMatchObject({ role: 'KITCHEN' })
      await expect(requireBoardAccess(theirs.id)).rejects.toMatchObject(forbidden)

      signInAs(await waiter(tx, [mine.id]))
      await expect(requireBoardAccess(mine.id)).resolves.toMatchObject({ role: 'WAITER' })
      await expect(requireBoardAccess(theirs.id)).rejects.toMatchObject(forbidden)
    }))

  it('refuses both of them every management guard, on the restaurant they are assigned to', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirDish = await dish(tx, mine.id)
      const theirCategory = await category(tx, mine.id)

      for (const account of [await kitchenTablet(tx, [mine.id]), await waiter(tx, [mine.id])]) {
        signInAs(account)
        await expect(requireRestaurantAccess({ id: mine.id }), account.role).rejects.toMatchObject(forbidden)
        await expect(requireDishAccess(theirDish.id), account.role).rejects.toMatchObject(forbidden)
        await expect(requireCategoryAccess(theirCategory.id), account.role).rejects.toMatchObject(forbidden)
        await expect(updateRestaurant(mine.id, { name: 'Renamed' }), account.role).rejects.toThrow()
      }
      expect((await tx.restaurant.findUniqueOrThrow({ where: { id: mine.id }, select: { name: true } })).name).toBe(mine.name)
    }))

  it('lets a waiter place an order and refuses a tablet, on the same restaurant', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await waiter(tx, [mine.id]))
      await expect(requireOrderingStaff(mine.id)).resolves.toMatchObject({ role: 'WAITER' })
      signInAs(await kitchenTablet(tx, [mine.id]))
      await expect(requireOrderingStaff(mine.id)).rejects.toMatchObject(forbidden)
    }))

  // A device is mailed at `staff.invalid`, which can never be routed: a second factor would be a
  // lock-out with no way back, so the account is refused one rather than trusted not to ask.
  it('refuses a device account a second factor, and leaves the row alone', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      for (const account of [await kitchenTablet(tx, [mine.id]), await waiter(tx, [mine.id])]) {
        signInAs(account)
        await expect(setMfaEnabled({ mfaEnabled: true }), account.role).rejects.toThrow(/device account/i)
        expect((await tx.user.findUniqueOrThrow({ where: { id: account.id }, select: { mfaEnabled: true } })).mfaEnabled).toBe(false)
      }
    }))
})
