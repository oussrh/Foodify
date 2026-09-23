import { expect, test } from '@playwright/test'
import { db } from './session'
import { deviceAccount, ownDish, signInDevice } from './staff'

// A waiter taking an order at the table: pick the table from the room, find the dish by typing
// rather than scrolling, read it back with a note on the dish and one on the order, send it, and
// see it land on the kitchen's board as an order someone took by hand. The two projects take
// their order at different tables and for a dish of their own, and remove what they placed.

test.describe('the waiter\'s phone', () => {
  test('takes an order at a table, with notes, and the kitchen sees it', async ({ page }, info) => {
    test.setTimeout(120_000)
    const table = info.project.name === 'phone' ? '1' : '2'
    const dish = await ownDish(info)
    const waiter = await deviceAccount('WAITER', info)

    try {
      await signInDevice(page, 'waiter', waiter.username)
      await page.getByRole('button', { name: new RegExp(`^Table ${table},`) }).click()
      await expect(page.getByRole('heading', { level: 1, name: `Table ${table}` })).toBeVisible()

      await page.getByLabel('Search the menu').fill(dish.name)
      await page.getByRole('button', { name: `Add ${dish.name}` }).click()
      await page.getByRole('button', { name: `Add ${dish.name}` }).click()
      await page.getByRole('button', { name: /^Review 2 items/ }).click()

      const review = page.getByRole('dialog')
      await expect(review.getByRole('heading', { name: `Table ${table}` })).toBeVisible()
      await review.getByLabel('Note for the kitchen on this dish').fill('No coriander')
      await review.getByLabel('Note for the whole order').fill('Starters first')
      await review.getByRole('button', { name: 'Send to the kitchen' }).click()
      await expect(page.getByText(/^Order #\d+ sent$/)).toBeVisible()

      // On the row: taken by this waiter, with no phone to text, and both notes where they belong.
      const order = await db().order.findFirstOrThrow({ where: { placedById: waiter.id }, include: { lines: true } })
      expect(order).toMatchObject({ table, phone: '', note: 'Starters first', status: 'NEW' })
      expect(order.lines).toEqual([expect.objectContaining({ dishId: dish.id, quantity: 2, note: 'No coriander' })])

      // And on the waiter's own list of what is with the kitchen.
      await page.getByRole('button', { name: 'Back to the tables' }).click()
      await page.getByRole('link', { name: 'Orders' }).click()
      await expect(page.getByRole('listitem').filter({ hasText: `#${order.number}` })).toContainText('taken at the table')
    } finally {
      await db().order.deleteMany({ where: { placedById: waiter.id } })
      await dish.remove()
      await waiter.remove()
    }
  })
})
