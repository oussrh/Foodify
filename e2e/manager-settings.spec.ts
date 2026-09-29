import { expect, test } from '@playwright/test'
import { ownRestaurant } from './manager'
import { auditAccount, db, signInAs, submitUntil } from './session'
import { signInDevice } from './staff'

// What a manager saves about a restaurant and who works it, on a restaurant of the test's own:
// the General settings hold after a reload (the save bar writes them, the page reads them back),
// and a waiter added on the People tab can sign in at the floor's door and is gone once removed.

test.describe('a manager\'s restaurant', () => {
  test('saves its name, its time zone, turns ordering on with a number of tables, and the settings hold', async ({ page }, info) => {
    const restaurant = await ownRestaurant(info)
    const manager = await auditAccount('manager', info.testId, { mfa: false, restaurantId: restaurant.id })
    const renamed = `${restaurant.name} renamed`
    try {
      await signInAs(page, 'manager', manager.email, { mfa: false })
      await page.goto(`/manager/restaurants/${restaurant.code}/edit`)
      await page.locator('#name').fill(renamed)
      await page.getByLabel('Online ordering').check()
      await page.getByLabel('Tables in the room').fill('4')
      await page.getByLabel('Time zone').selectOption('Africa/Casablanca')
      await page.getByRole('button', { name: 'Save changes' }).click()

      await expect
        .poll(() => db().restaurant.findUniqueOrThrow({ where: { id: restaurant.id }, select: { name: true, orderingEnabled: true, tableCount: true, timeZone: true } }))
        .toEqual({ name: renamed, orderingEnabled: true, tableCount: 4, timeZone: 'Africa/Casablanca' })
      await page.reload()
      await expect(page.locator('#name')).toHaveValue(renamed)
      await expect(page.getByLabel('Online ordering')).toBeChecked()
      await expect(page.getByLabel('Time zone')).toHaveValue('Africa/Casablanca')
    } finally {
      await manager.remove()
      await restaurant.remove()
    }
  })

  test('says a refused save was refused, and stores nothing', async ({ page }, info) => {
    const restaurant = await ownRestaurant(info)
    const manager = await auditAccount('manager', info.testId, { mfa: false, restaurantId: restaurant.id })
    try {
      await signInAs(page, 'manager', manager.email, { mfa: false })
      await page.goto(`/manager/restaurants/${restaurant.code}/edit`)
      await page.locator('#slug').fill('Not A Slug')
      await page.getByRole('button', { name: 'Save changes' }).click()
      // Not "You have unsaved changes", as if nothing had been tried: two saves once failed that silently.
      await expect(page.getByText('Could not save. Check the fields and try again.')).toBeVisible()
      expect((await db().restaurant.findUniqueOrThrow({ where: { id: restaurant.id } })).slug).toBe(restaurant.slug)
    } finally {
      await manager.remove()
      await restaurant.remove()
    }
  })

  test('adds a manager with a generated password, who then signs in with it', async ({ page, browser }, info) => {
    test.setTimeout(120_000)
    const restaurant = await ownRestaurant(info)
    const manager = await auditAccount('manager', info.testId, { mfa: false, restaurantId: restaurant.id })
    const email = `new-${restaurant.slug}@foodify.test`
    try {
      await signInAs(page, 'manager', manager.email, { mfa: false })
      await page.goto(`/manager/restaurants/${restaurant.code}/users`)
      await page.getByRole('button', { name: 'Add manager' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Email address').fill(email)
      await dialog.getByRole('button', { name: 'Generate' }).click()
      const password = await dialog.getByLabel('Password', { exact: true }).inputValue()
      // Strong, and visible so it can be handed over: 14 characters of every class.
      expect(password).toMatch(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{14}$/)
      await dialog.getByRole('button', { name: 'Add manager' }).click()
      await expect(page.getByRole('button', { name: `Remove ${email}` })).toBeVisible()

      const colleague = await browser.newPage()
      await colleague.goto('/manager/login')
      await colleague.getByLabel(/email/i).fill(email)
      await colleague.getByLabel(/password/i).fill(password)
      await submitUntil(colleague.getByRole('button', { name: /continue|sign in/i }), async () => !colleague.url().includes('/login'))
      await expect(colleague).toHaveURL(new RegExp(`/manager/restaurants/${restaurant.code}`))
      await colleague.close()
    } finally {
      await db().user.deleteMany({ where: { email } })
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
      await page.goto(`/manager/restaurants/${restaurant.code}/users`)
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
