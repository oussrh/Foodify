import { expect, test } from '@playwright/test'
import { db } from './session'
import { deviceAccount, ownDish, runTag, signInDevice } from './staff'

// A dish the kitchen runs out of, from the tablet's one tap to what the guest sees and what the
// endpoint accepts: marked on the menu and not orderable, refused by POST /api/orders even from a
// cart built before it ran out, and back with a second tap. The dish is this test's own, so the
// other specs ordering from the seeded menu never meet a sold-out dish of this one's making.

const MENU = '/restaurant/foodify-test-kitchen?lang=en'

test.describe('sold out', () => {
  test('a tap on the tablet takes a dish off tonight\'s orders, and a second tap brings it back', async ({ page, browser, request }, info) => {
    test.setTimeout(120_000)
    const dish = await ownDish(info)
    const kitchen = await deviceAccount('KITCHEN', info)
    const table = `e2e-${runTag(info)}`
    // The tablet's switch answers at once and saves behind it; what the guest is served is the row.
    const soldOutSaved = () => db().dish.findUniqueOrThrow({ where: { id: dish.id } }).then((row) => row.soldOutUntil !== null)
    const order = () =>
      request.post('/api/orders', {
        data: { restaurantId: dish.restaurantId, table, phone: '+212600112233', lines: [{ dishId: dish.id, quantity: 1 }] },
      })

    try {
      await signInDevice(page, 'kitchen', kitchen.username)
      await page.goto(`/kitchen/${dish.restaurantCode}/menu`)
      const toggle = page.getByRole('button', { name: new RegExp(dish.name) })
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-pressed', 'true')
      await expect(toggle).toContainText('Sold out today')
      await expect.poll(soldOutSaved).toBe(true)

      // The guest still finds it on the menu, but cannot add it.
      const guest = await browser.newPage()
      await guest.goto(MENU)
      await guest.locator('[data-hydrated]').waitFor()
      await expect(guest.getByRole('link', { name: new RegExp(dish.name) }).first()).toBeVisible()
      await expect(guest.getByRole('button', { name: new RegExp(`^Add ${dish.name}`) })).toHaveCount(0)

      // A cart built before it ran out is refused by the endpoint, and says why.
      const refused = await order()
      expect(refused.status()).toBe(409)
      expect(await refused.text()).toContain('sold_out')

      // Back on: orderable again, from the menu and from the endpoint.
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
      await expect.poll(soldOutSaved).toBe(false)
      await guest.reload()
      await guest.locator('[data-hydrated]').waitFor()
      await expect(guest.getByRole('button', { name: new RegExp(`^Add ${dish.name}`) }).first()).toBeVisible()
      expect((await order()).status()).toBe(201)
      await guest.close()
    } finally {
      await db().order.deleteMany({ where: { table, restaurantId: dish.restaurantId } })
      await dish.remove()
      await kitchen.remove()
    }
  })
})
