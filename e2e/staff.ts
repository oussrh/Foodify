// e2e/staff.ts
// What the staff journeys need beside a signed-in manager: device accounts (an order tablet, a
// waiter) signed in the way a device is — a username and a password, no second factor — and
// rows a test owns outright, so the phone and desktop projects never race on a shared one: a
// dish of its own on the seeded menu, and the table it orders for. Everything made here is
// removed by the test that made it.
import bcrypt from 'bcryptjs'
import { expect, type Page, type TestInfo } from '@playwright/test'
import { db, seededIds } from './session'

const PASSWORD = 'device-only'

/** A short, stable tag for this test in this project: two projects run the same title and must not collide. */
export function runTag(info: TestInfo): string {
  let hash = 7
  for (const char of info.testId) hash = Math.imul(hash, 31) + char.charCodeAt(0)
  return Math.abs(hash).toString(36)
}

type Device = 'KITCHEN' | 'WAITER'

/** A device account on the seeded restaurant, made the way the People tab makes one; `remove` deletes it. */
export async function deviceAccount(role: Device, info: TestInfo) {
  const { restaurantId } = await seededIds()
  const username = `e2e-${role === 'KITCHEN' ? 'k' : 'w'}-${runTag(info)}`
  await db().user.deleteMany({ where: { username } })
  const user = await db().user.create({
    data: {
      username,
      email: `${username}@staff.invalid`,
      passwordHash: await bcrypt.hash(PASSWORD, 4),
      role,
      mfaEnabled: false,
      restaurants: { connect: { id: restaurantId } },
    },
    select: { id: true },
  })
  return { id: user.id, username, remove: () => db().user.deleteMany({ where: { username } }) }
}

/** Signs a device in at its own door; with one restaurant it lands on that restaurant's screen. */
export async function signInDevice(page: Page, portal: 'kitchen' | 'waiter', username: string) {
  await page.goto(`/${portal}/login`)
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Continue' }).click()
  // Off the login page and onto a rendered screen, not merely "under /kitchen": `/kitchen/login`
  // is under it too, and navigating away before the sign-in lands aborts it with no cookie set.
  await expect(page).toHaveURL(new RegExp(`/${portal}/(?!login)[^/]+`))
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Sign in')
}

/**
 * A dish of this test's own on the seeded menu, in the same section as the seeded dishes so the
 * guest menu shows it; available, no model. Named so a search finds only it.
 */
export async function ownDish(info: TestInfo) {
  const { restaurantId, dishId } = await seededIds()
  const seeded = await db().dish.findUniqueOrThrow({ where: { id: dishId }, select: { subcategoryId: true } })
  const nameEn = `E2E dish ${runTag(info)}`
  const dish = await db().dish.create({
    data: {
      restaurantId,
      subcategoryId: seeded.subcategoryId,
      nameEn,
      nameFr: nameEn,
      descriptionEn: 'Made by a browser test and removed after it.',
      descriptionFr: 'Créé par un test et supprimé après.',
      price: '7.50',
      imageUrl: '',
      usdzUrl: '',
      glbUrl: '',
      sortOrder: 999,
    },
    select: { id: true },
  })
  const remove = async () => {
    await db().orderLine.updateMany({ where: { dishId: dish.id }, data: { dishId: null } })
    await db().dishView.deleteMany({ where: { dishId: dish.id } })
    await db().dish.deleteMany({ where: { id: dish.id } })
  }
  return { id: dish.id, name: nameEn, restaurantId, remove }
}
