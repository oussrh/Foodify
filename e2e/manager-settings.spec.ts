import { expect, test } from '@playwright/test'
import { ownRestaurant } from './manager'
import { auditAccount, db, signInAs } from './session'
import { signInDevice } from './staff'

// What a manager saves about a restaurant and who works it, on a restaurant of the test's own:
// the General settings hold after a reload (the save bar writes them, the page reads them back),
// and a waiter added on the People tab can sign in at the floor's door and is gone once removed.

test.describe('a manager\'s restaurant', () => {
  test('saves its name, turns ordering on with a number of tables, and the settings hold', async ({ page }, info) => {
    const restaurant = await ownRestaurant(info)
    const manager = await auditAccount('manager', info.testId, { mfa: false, restaurantId: restaurant.id })
    const renamed = `${restaurant.name} renamed`
    try {
      await signInAs(page, 'manager', manager.email, { mfa: false })
      await page.goto(`/manager/restaurants/${restaurant.id}/edit`)
      await page.locator('#name').fill(renamed)
      await page.getByLabel('Online ordering').check()
      await page.getByLabel('Tables in the room').fill('4')
      await page.getByRole('button', { name: 'Save changes' }).click()

      await expect
        .poll(() => db().restaurant.findUniqueOrThrow({ where: { id: restaurant.id }, select: { name: true, orderingEnabled: true, tableCount: true } }))
        .toEqual({ name: renamed, orderingEnabled: true, tableCount: 4 })
      await page.reload()
      await expect(page.locator('#name')).toHaveValue(renamed)
      await expect(page.getByLabel('Online ordering')).toBeChecked()
    } finally {
      await manager.remove()
      await restaurant.remove()
    }
  })

  test('adds a waiter on the People tab, who can then sign in, and removes them', async ({ page, browser }, info) => {
    test.setTimeout(120_000)
    const restaurant = await ownRestaurant(info)
    const manager = await auditAccount('manager', info.testId, { mfa: false, restaurantId: restaurant.id })
    const username = `w-${restaurant.slug}`.slice(0, 30)
    try {
      await signInAs(page, 'manager', manager.email, { mfa: false })
      await page.goto(`/manager/restaurants/${restaurant.id}/users`)
      await page.locator('#WAITER-username').fill(username)
      // The password `signInDevice` signs a device in with (`e2e/staff.ts`).
      await page.locator('#WAITER-password').fill('device-only')
      await page.getByRole('button', { name: 'Add waiter' }).click()
      await expect(page.getByRole('button', { name: `Remove ${username}` })).toBeVisible()

      const phone = await browser.newPage()
      await signInDevice(phone, 'waiter', username)
      await expect(phone.getByRole('heading', { level: 1 })).toBeVisible()
      await phone.close()

      await page.getByRole('button', { name: `Remove ${username}` }).click()
      await expect.poll(() => db().user.count({ where: { username } })).toBe(0)
    } finally {
      await db().user.deleteMany({ where: { username } })
      await manager.remove()
      await restaurant.remove()
    }
  })
})
