import { expect, test, type Page } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'
import { auditAccount, seededIds, signInAs } from './session'
import { deviceAccount, signInDevice } from './staff'

// The whole site under axe (A11Y.1): every page a guest, a manager, an admin or a device can reach, on a
// phone and a desk, with no serious or critical violation. One test per audience: the portals
// sign in once (as an account made for the test, removed after) and walk their pages; a failure
// names the page. The menu's states (a sheet open, filters) are the menu spec's; this sweep is
// the pages at rest.

/** Lands on the page asked for (not a login redirect), waits for its h1, then scans; the page is named in every failure. */
async function scan(page: Page, path: string) {
  await page.goto(path)
  expect(new URL(page.url()).pathname, `${path}: redirected to ${page.url()}`).toBe(path)
  await expect(page.getByRole('heading', { level: 1 }), `${path}: no h1`).toBeVisible()
  await expectNoSeriousA11yViolations(page, path)
}

/** The settings page and its two other tabs. */
async function scanSettings(page: Page, editPath: string) {
  await scan(page, editPath)
  for (const tab of ['Contact & hours', 'Branding']) {
    await page.getByRole('tab', { name: tab }).click()
    await expectNoSeriousA11yViolations(page, `${editPath} (${tab})`)
  }
}

test.describe('accessibility sweep', () => {
  // A sweep walks a dozen pages and scans each; the default budget is for one.
  test.setTimeout(180_000)

  test('the public pages', async ({ page }) => {
    const { dishId } = await seededIds()
    for (const path of ['/', `/restaurant/foodify-test-kitchen/dish/${dishId}`, '/offline', '/3d-viewer', '/admin/mfa', '/manager/mfa']) {
      await scan(page, path)
    }
  })

  test('the manager portal', async ({ page }, info) => {
    const { restaurantId, dishId } = await seededIds()
    const account = await auditAccount('manager', info.testId)
    await signInAs(page, 'manager', account.email)
    const r = `/manager/restaurants/${restaurantId}`
    // No `/manager`: the audit account manages one restaurant, so the portal home redirects into
    // it, and `${r}/info` below is the page it lands on.
    for (const path of ['/manager/restaurants', '/manager/profile', '/manager/change-email', `${r}/dishes`, `${r}/dishes/create`, `${r}/dishes/${dishId}/edit`, `${r}/menu`, `${r}/info`, `${r}/insights`, `${r}/orders`, `${r}/tables`, `${r}/users`]) {
      await scan(page, path)
    }
    await scanSettings(page, `${r}/edit`)
    await account.remove()
  })

  test('the admin portal', async ({ page }, info) => {
    const { restaurantId, dishId, adminId, managerId } = await seededIds()
    const account = await auditAccount('admin', info.testId)
    await signInAs(page, 'admin', account.email)
    const r = `/admin/restaurants/${restaurantId}`
    const pages = [
      '/admin', '/admin/profile', '/admin/admins', '/admin/admins/create', `/admin/admins/${adminId}/edit`,
      '/admin/restaurants', '/admin/restaurants/create', `${r}/dishes`, `${r}/dishes/create`, `${r}/dishes/${dishId}/edit`, `${r}/menu`, `${r}/info`, `${r}/insights`, `${r}/users`, `${r}/orders`, `${r}/tables`,
      '/admin/users', '/admin/users/create', `/admin/users/${managerId}/edit`, `/admin/users/${managerId}/restaurants`,
    ]
    for (const path of pages) await scan(page, path)
    await scanSettings(page, `${r}/edit`)
    await account.remove()
  })

  test('the devices', async ({ page }, info) => {
    const { restaurantId } = await seededIds()
    const kitchen = await deviceAccount('KITCHEN', info)
    const waiter = await deviceAccount('WAITER', info)
    try {
      await signInDevice(page, 'kitchen', kitchen.username)
      for (const path of [`/kitchen/orders/${restaurantId}`, `/kitchen/menu/${restaurantId}`]) await scan(page, path)
      await page.context().clearCookies()
      await signInDevice(page, 'waiter', waiter.username)
      for (const path of [`/waiter/${restaurantId}`, `/waiter/${restaurantId}/orders`, `/waiter/${restaurantId}/availability`]) await scan(page, path)
    } finally {
      await kitchen.remove()
      await waiter.remove()
    }
  })
})
