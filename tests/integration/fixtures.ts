// tests/integration/fixtures.ts
// Rows created inside the running transaction: two restaurants, a manager for each, a super
// admin, a dish. Names carry a random suffix so a test never collides with the seed or another
// test's leftovers on a shared database.
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import type { Tx } from './db'

const tag = () => randomUUID().slice(0, 8)

export async function restaurant(tx: Tx, name = `Test ${tag()}`) {
  return tx.restaurant.create({ data: { name, slug: `test-${tag()}`, defaultLocale: 'en' }, select: { id: true, slug: true, name: true } })
}

export async function manager(tx: Tx, restaurantIds: string[]) {
  return tx.user.create({
    data: { email: `manager-${tag()}@test.local`, passwordHash: await bcrypt.hash('correct horse', 4), role: 'RESTAURANT_ADMIN', restaurants: { connect: restaurantIds.map((id) => ({ id })) } },
    select: { id: true, email: true, role: true },
  })
}

export async function superAdmin(tx: Tx) {
  return tx.user.create({
    data: { email: `admin-${tag()}@test.local`, passwordHash: await bcrypt.hash('correct horse', 4), role: 'SUPER_ADMIN' },
    select: { id: true, email: true, role: true },
  })
}

export async function dish(tx: Tx, restaurantId: string, nameEn = `Dish ${tag()}`) {
  return tx.dish.create({
    data: { restaurantId, nameEn, nameFr: nameEn, descriptionEn: '', descriptionFr: '', price: '9.50', imageUrl: '/d.jpg', usdzUrl: '', glbUrl: '', sortOrder: 0 },
    select: { id: true, restaurantId: true },
  })
}

export async function category(tx: Tx, restaurantId: string, nameEn = `Category ${tag()}`) {
  return tx.menuCategory.create({ data: { restaurantId, nameEn, nameFr: nameEn, sortOrder: 0 }, select: { id: true, restaurantId: true } })
}
