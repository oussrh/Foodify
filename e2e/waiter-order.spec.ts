import { expect, test, type Page } from '@playwright/test'
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

  // One bill per table visit: the guests ask for more, the waiter opens the same table, sees what
  // it already has, and the send joins that bill rather than opening an unrelated order; the
  // kitchen reads the new ticket as more for a table it already knows.
  test('adds to the order a table already has, and the kitchen sees it as an addition', async ({ page, browser }, info) => {
    test.setTimeout(150_000)
    const table = info.project.name === 'phone' ? '3' : '4'
    const dish = await ownDish(info)
    const waiter = await deviceAccount('WAITER', info)
    const kitchen = await deviceAccount('KITCHEN', info)
    const clearTable = () => db().order.deleteMany({ where: { table, restaurantId: dish.restaurantId } })

    try {
      // The table starts empty, so the first send opens its bill whatever an earlier run left.
      await clearTable()
      await signInDevice(page, 'waiter', waiter.username)
      await orderOne(page, table, dish.name)
      await page.getByRole('dialog').getByRole('button', { name: 'Send to the kitchen' }).click()
      await expect(page.getByText(/^Order #\d+ sent$/)).toBeVisible()
      const first = await db().order.findFirstOrThrow({ where: { placedById: waiter.id, table } })
      await page.getByRole('button', { name: 'Back to the tables' }).click()

      // Back at the same table: what it already has is one tap away, in the header.
      await page.getByRole('button', { name: new RegExp(`^Table ${table},`) }).click()
      await page.getByRole('button', { name: `Current order #${first.number}` }).click()
      const tab = page.getByRole('dialog')
      await expect(tab.getByRole('heading', { name: `Table ${table} · Order #${first.number}` })).toBeVisible()
      await expect(tab).toContainText(dish.name)
      await expect(tab).toContainText('Total')
      await page.keyboard.press('Escape')
      await expect(tab).toHaveCount(0)

      // More for the same party: the send says where it is going, and goes there.
      await orderOne(page, table, dish.name, false)
      await page.getByRole('dialog').getByRole('button', { name: `Add to order #${first.number}` }).click()
      await expect(page.getByText(`Added to order #${first.number}`)).toBeVisible()
      const addition = await db().order.findFirstOrThrow({ where: { parentId: first.id } })
      expect(addition).toMatchObject({ table, placedById: waiter.id, status: 'NEW' })
      expect(await db().order.count({ where: { table, restaurantId: dish.restaurantId } })).toBe(2)

      // The pass: the new ticket says whose table it belongs with.
      const tablet = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
      await signInDevice(tablet, 'kitchen', kitchen.username)
      const card = tablet.getByRole('article').filter({ hasText: `#${addition.number}` }).filter({ hasText: `Table ${table}` })
      await expect(card).toContainText(`Addition to #${first.number}`)
      await tablet.context().close()
    } finally {
      await clearTable()
      await dish.remove()
      await waiter.remove()
      await kitchen.remove()
    }
  })
})

/** Opens `table` from the room (unless already on it), finds the dish by name, adds one and opens the read-back. */
async function orderOne(page: Page, table: string, dishName: string, fromRoom = true) {
  if (fromRoom) await page.getByRole('button', { name: new RegExp(`^Table ${table},`) }).click()
  await expect(page.getByRole('heading', { level: 1, name: `Table ${table}` })).toBeVisible()
  await page.getByLabel('Search the menu').fill(dishName)
  await page.getByRole('button', { name: `Add ${dishName}` }).click()
  await page.getByRole('button', { name: /^Review 1 item/ }).click()
}
