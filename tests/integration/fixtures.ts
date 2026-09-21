// tests/integration/fixtures.ts
// Rows created inside the running transaction: restaurants, users of either role, dishes,
// categories. Everything is rolled back, so names only need to differ from the seed's and from
// each other within a test: a counter does that and is deterministic.
import bcrypt from 'bcryptjs'
import type { Tx } from './db'

// The lowest cost bcrypt accepts: the hash is compared, never cracked, in a test.
const HASH_COST = 4
const PASSWORD = 'correct horse'

let n = 0
const tag = () => `t${++n}`

export async function restaurant(tx: Tx, name = `Test ${tag()}`) {
  return tx.restaurant.create({ data: { name, slug: `test-${tag()}`, defaultLocale: 'en' }, select: { id: true, slug: true, name: true } })
}

async function user(tx: Tx, role: 'SUPER_ADMIN' | 'RESTAURANT_ADMIN', restaurantIds: string[]) {
  return tx.user.create({
    data: {
      email: `${role.toLowerCase()}-${tag()}@test.local`,
      passwordHash: await bcrypt.hash(PASSWORD, HASH_COST),
      role,
      restaurants: { connect: restaurantIds.map((id) => ({ id })) },
    },
    select: { id: true, email: true, role: true },
  })
}

export const manager = (tx: Tx, restaurantIds: string[]) => user(tx, 'RESTAURANT_ADMIN', restaurantIds)
export const superAdmin = (tx: Tx) => user(tx, 'SUPER_ADMIN', [])

export async function dish(tx: Tx, restaurantId: string, extra: { subcategoryId?: string; nameEn?: string } = {}) {
  const nameEn = extra.nameEn ?? `Dish ${tag()}`
  return tx.dish.create({
    data: { restaurantId, nameEn, nameFr: nameEn, descriptionEn: '', descriptionFr: '', price: '9.50', imageUrl: '/d.jpg', usdzUrl: '', glbUrl: '', sortOrder: 0, subcategoryId: extra.subcategoryId ?? null },
    select: { id: true, restaurantId: true },
  })
}

export async function category(tx: Tx, restaurantId: string, sortOrder = 0) {
  const nameEn = `Category ${tag()}`
  return tx.menuCategory.create({ data: { restaurantId, nameEn, nameFr: nameEn, sortOrder }, select: { id: true, restaurantId: true } })
}

export async function subcategory(tx: Tx, categoryId: string) {
  const nameEn = `Subcategory ${tag()}`
  return tx.menuSubcategory.create({ data: { categoryId, nameEn, nameFr: nameEn, sortOrder: 0 }, select: { id: true, categoryId: true } })
}

export async function ingredient(tx: Tx, dishId: string) {
  return tx.ingredient.create({ data: { dishId, nameEn: 'Salt', nameFr: 'Sel' }, select: { id: true } })
}
