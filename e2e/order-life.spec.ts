import { expect, test, type Browser, type Page } from '@playwright/test'
import { db } from './session'
import { deviceAccount, ownDish, runTag, signInDevice } from './staff'

// An order from the moment a guest sends it to the moment it reaches the table, across the three
// screens it passes through: the kitchen tablet starts it and calls it up, the waiter's phone
// sees it ready and carries it out, and the stamps each move leaves are on the row. The guest's
// side of sending is `ordering.spec.ts`; here the order is sent the way the menu sends it, to
// the same endpoint, so this spec starts where that one stops. The table is this run's own, so
// the phone and desktop projects each follow their own order across a board they share.

/** A second browser context for a second device: its own cookies, as a second tablet would have. */
async function deviceWindow(browser: Browser, viewport: { width: number; height: number }): Promise<Page> {
  const context = await browser.newContext({ viewport })
  return context.newPage()
}

test.describe('an order through the kitchen and the floor', () => {
  test('is started and called up on the board, then carried out from the waiter\'s phone', async ({ page, browser, request }, info) => {
    test.setTimeout(120_000)
    const table = `e2e-${runTag(info)}`
    const dish = await ownDish(info)
    const kitchen = await deviceAccount('KITCHEN', info)
    const waiter = await deviceAccount('WAITER', info)

    try {
      const sent = await request.post('/api/orders', {
        data: { restaurantId: dish.restaurantId, table, phone: '+212600112233', locale: 'en', lines: [{ dishId: dish.id, quantity: 2 }] },
      })
      expect(sent.status()).toBe(201)
      const { data: order } = (await sent.json()) as { data: { id: string; number: number } }

      // The tablet: the order arrives in the waiting lane with its one move.
      await signInDevice(page, 'kitchen', kitchen.username)
      const card = page.getByRole('article').filter({ hasText: `Table ${table}` })
      await expect(card).toContainText(`#${order.number}`)
      await expect(card).toContainText(dish.name)
      await card.getByRole('button', { name: 'Start' }).click()
      await expect(card.getByRole('button', { name: 'Ready to serve' })).toBeVisible()
      await card.getByRole('button', { name: 'Ready to serve' }).click()
      // Called up, it leaves the working lanes for the drawer the floor empties.
      await expect(card).toHaveCount(0)
      await expect(page.getByRole('button', { name: /ready to serve$/ })).toBeVisible()

      // The waiter's phone: the order is listed as ready, and carrying it out closes it.
      const phone = await deviceWindow(browser, { width: 412, height: 915 })
      await signInDevice(phone, 'waiter', waiter.username)
      await phone.getByRole('link', { name: 'Orders' }).click()
      const carry = phone.getByRole('button', { name: `Carried to table ${table}` })
      await expect(carry).toBeVisible()
      await carry.click()
      // Not the button going away: it reads "Saving…" the moment it is tapped. The order leaves the
      // list once the move is stored, and the row says so.
      await expect(phone.getByRole('listitem').filter({ hasText: `#${order.number}` })).toHaveCount(0)
      await expect.poll(() => db().order.findUniqueOrThrow({ where: { id: order.id } }).then((o) => o.status)).toBe('DONE')
      await phone.context().close()

      const row = await db().order.findUniqueOrThrow({ where: { id: order.id } })
      expect(row.status).toBe('DONE')
      expect(row.acceptedAt).not.toBeNull()
      expect(row.readyAt).not.toBeNull()
      expect(row.servedAt).not.toBeNull()
    } finally {
      await db().order.deleteMany({ where: { table, restaurantId: dish.restaurantId } })
      await dish.remove()
      await kitchen.remove()
      await waiter.remove()
    }
  })

  test('keeps an order tablet to its board: the portals are closed to it', async ({ page }, info) => {
    const kitchen = await deviceAccount('KITCHEN', info)
    try {
      await signInDevice(page, 'kitchen', kitchen.username)
      // The manager portal sends anyone who is not a manager to their own home: a tablet, its board.
      await page.goto('/manager')
      await expect(page).toHaveURL(/\/kitchen\/orders\//)
      // The admin portal lets only a super admin stay.
      await page.goto('/admin')
      await expect(page).not.toHaveURL(/\/admin/)
    } finally {
      await kitchen.remove()
    }
  })
})
