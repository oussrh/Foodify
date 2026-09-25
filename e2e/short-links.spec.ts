import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'
import { auditAccount, seededIds, signInAs } from './session'
import { deviceAccount, signInDevice } from './staff'

// Every restaurant page is addressed by the restaurant's short code, and every address handed out
// before that keeps working: the kitchen tablet's old routes serve the same screens in place (a
// rewrite, so an installed tablet stays inside the scope it was installed with), a portal page's
// uuid is a permanent redirect (308) to the one address the page now has, a segment of neither
// shape is a 404, and Settings shows the code with the two device links built from it.

test.describe('short restaurant links', () => {
  test("the kitchen tablet's old addresses still serve its screens, in place", async ({ page }, info) => {
    const { restaurantId, restaurantCode: code } = await seededIds()
    const kitchen = await deviceAccount('KITCHEN', info)
    try {
      await signInDevice(page, 'kitchen', kitchen.username)
      await expect(page).toHaveURL(new RegExp(`/kitchen/${code}$`))

      // No redirect: the address a tablet was installed under answers the board itself.
      for (const path of [`/kitchen/orders/${code}`, `/kitchen/orders/${restaurantId}`, `/kitchen/menu/${code}`]) {
        const answer = await page.request.get(path, { maxRedirects: 0 })
        expect(answer.status(), path).toBe(200)
        await page.goto(path)
        expect(new URL(page.url()).pathname).toBe(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      }

      // The manifest a tablet installs from opens the new board and keeps the identity it had.
      const manifest = await (await page.request.get(`/orders/manifest?id=${code}&portal=kitchen`)).json()
      expect(manifest).toMatchObject({ id: `/kitchen/orders/${code}`, start_url: `/kitchen/${code}`, scope: `/kitchen/${code}` })

      // The kitchen's own words are never a restaurant, and neither is a segment of no shape.
      for (const path of ['/kitchen/orders', '/kitchen/menu', '/kitchen/not-a-restaurant']) {
        expect((await page.request.get(path)).status(), path).toBe(404)
      }
    } finally {
      await kitchen.remove()
    }
  })

  test('signed out, an old kitchen address meets the same sign-in as the new one', async ({ page }) => {
    const { restaurantCode: code } = await seededIds()
    for (const path of [`/kitchen/orders/${code}`, `/kitchen/${code}`]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/kitchen\/login/)
    }
  })

  test('a portal page reached by the uuid is a permanent redirect to its code address', async ({ page }, info) => {
    const { restaurantId, restaurantCode: code } = await seededIds()
    const account = await auditAccount('manager', info.testId, { mfa: false })
    try {
      await signInAs(page, 'manager', account.email, { mfa: false })
      const old = await page.request.get(`/manager/restaurants/${restaurantId}/dishes?search=a`, { maxRedirects: 0 })
      expect(old.status()).toBe(308)
      expect(old.headers().location).toContain(`/manager/restaurants/${code}/dishes?search=a`)

      await page.goto(`/manager/restaurants/${code.toLowerCase()}/menu`)
      expect(new URL(page.url()).pathname).toBe(`/manager/restaurants/${code}/menu`)

      expect((await page.request.get('/manager/restaurants/not-a-restaurant/info')).status()).toBe(404)
    } finally {
      await account.remove()
    }
  })

  test('Settings shows the code and the two device links, each with its own Copy', async ({ page, context }, info) => {
    const { restaurantCode: code } = await seededIds()
    const account = await auditAccount('manager', info.testId, { mfa: false })
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'])
      await signInAs(page, 'manager', account.email, { mfa: false })
      await page.goto(`/manager/restaurants/${code}/edit`)
      const field = page.getByLabel('Restaurant code', { exact: true })
      await expect(field).toHaveValue(code)
      await expect(field).toHaveAttribute('readonly', '')
      await expect(page.getByLabel('Kitchen tablet link', { exact: true })).toHaveValue(new RegExp(`/kitchen/${code}$`))
      await expect(page.getByLabel('Waiter phone link', { exact: true })).toHaveValue(new RegExp(`/waiter/${code}$`))

      const copy = page.getByRole('button', { name: 'Copy restaurant code' })
      const box = await copy.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(48)
      await copy.click()
      await expect(page.getByText('Restaurant code copied')).toBeVisible()
      await expectNoSeriousA11yViolations(page, 'settings: the restaurant code and its device links')
    } finally {
      await account.remove()
    }
  })
})
