import { expect, test, type Page } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'
import { auditAccount, db, signInAs } from './session'
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

// The bill after it was sent: a dish the table no longer wants comes off a ticket the kitchen is
// already cooking only when the kitchen says so, and the table is closed once it has paid. The
// kitchen accepts on the card, the line is struck and the total drops on the waiter's phone, and
// a closed table has no current order the next time it is opened; a manager then voids what was
// left, from the order's details in the portal. Each new sheet is scanned.
test.describe('the waiter’s bill', () => {
  test('asks the kitchen to take a dish off, closes the table, and a manager voids the rest', async ({ page, browser }, info) => {
    test.setTimeout(180_000)
    const table = info.project.name === 'phone' ? '5' : '6'
    const dish = await ownDish(info)
    const waiter = await deviceAccount('WAITER', info)
    const kitchen = await deviceAccount('KITCHEN', info)
    const manager = await auditAccount('manager', info.testId, { mfa: false })
    const clearTable = () => db().order.deleteMany({ where: { table, restaurantId: dish.restaurantId } })

    try {
      await clearTable()
      await signInDevice(page, 'waiter', waiter.username)
      await page.getByRole('button', { name: new RegExp(`^Table ${table},`) }).click()
      await page.getByLabel('Search the menu').fill(dish.name)
      await page.getByRole('button', { name: `Add ${dish.name}` }).click()
      await page.getByRole('button', { name: `Add ${dish.name}` }).click()
      await page.getByRole('button', { name: /^Review 2 items/ }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Send to the kitchen' }).click()
      await expect(page.getByText(/^Order #\d+ sent$/)).toBeVisible()
      const sent = await db().order.findFirstOrThrow({ where: { placedById: waiter.id, table }, select: { id: true, number: true } })

      // The pass starts it: from here the floor can only ask.
      const tablet = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage()
      await signInDevice(tablet, 'kitchen', kitchen.username)
      const card = tablet.getByRole('article').filter({ hasText: `#${sent.number}` }).filter({ hasText: `Table ${table}` })
      await card.getByRole('button', { name: 'Start' }).click()
      await expect(card.getByRole('button', { name: 'Ready to serve' })).toBeVisible()

      await page.getByRole('button', { name: 'Back to the tables' }).click()
      await page.getByRole('button', { name: new RegExp(`^Table ${table},`) }).click()
      await page.getByRole('button', { name: `Current order #${sent.number}` }).click()
      const sheet = page.getByRole('dialog')
      await expect(sheet.getByRole('button', { name: `Ask to remove ${dish.name}` })).toBeVisible()
      await expectNoSeriousA11yViolations(page, 'waiter: the table’s bill')
      await sheet.getByRole('button', { name: `Ask to remove ${dish.name}` }).click()
      await expect(sheet.getByRole('heading', { name: `Ask to remove ${dish.name}` })).toBeVisible()
      await expectNoSeriousA11yViolations(page, 'waiter: the reason picker')
      await sheet.getByRole('button', { name: 'Guest changed their mind' }).click()
      await expect(sheet).toContainText('Waiting for the kitchen: remove 1')

      // The pass: the request is on the card, and accepting it strikes the dish.
      await expect(card).toContainText(`Table ${table} asks to remove 1 ${dish.name}`, { timeout: 15_000 })
      await expectNoSeriousA11yViolations(tablet, 'kitchen: a request on the board')
      await card.getByRole('button', { name: `Accept: remove 1 ${dish.name}` }).click()
      await expect(card).toContainText(`−1 ${dish.name}`, { timeout: 15_000 })
      const line = await db().orderLine.findFirstOrThrow({ where: { orderId: sent.id } })
      expect(line).toMatchObject({ quantity: 2, removedQuantity: 1 })
      expect((await db().order.findUniqueOrThrow({ where: { id: sent.id } })).subtotal.toFixed(2)).toBe('7.50')

      // Back on the phone: the answer, the struck portion and the new total.
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: `Current order #${sent.number}` }).click()
      await expect(sheet).toContainText(`Kitchen accepted: remove 1 ${dish.name}`)
      await expect(sheet).toContainText('−1 removed')
      await expect(sheet).toContainText(/Total\s*\D*7[.,]50/)

      // Paid: a close is final, so the phone always asks; with one dish still cooking it asks again.
      await sheet.getByRole('button', { name: 'Close table' }).click()
      await expect(sheet.getByRole('alert')).toContainText(`Close table ${table}? The bill is paid and the table is free for the next party.`)
      await expectNoSeriousA11yViolations(page, 'waiter: close the table?')
      await sheet.getByRole('alert').getByRole('button', { name: 'Close table' }).click()
      await expect(sheet.getByRole('alert')).toContainText('1 dish still in the kitchen. Close anyway?')
      await expectNoSeriousA11yViolations(page, 'waiter: close anyway?')
      await sheet.getByRole('button', { name: 'Close anyway' }).click()
      await expect(sheet).toHaveCount(0)
      expect((await db().order.findUniqueOrThrow({ where: { id: sent.id } })).closedAt).not.toBeNull()

      // The table is free again, and opening it shows no current order.
      await page.getByRole('button', { name: 'Back to the tables' }).click()
      await page.getByRole('button', { name: `Table ${table}, free` }).click()
      await expect(page.getByRole('heading', { level: 1, name: `Table ${table}` })).toBeVisible()
      await expect(page.getByRole('button', { name: /^Current order/ })).toHaveCount(0)

      // The pass plates the last one; once it is ready, taking it off is a manager's void.
      await card.getByRole('button', { name: 'Ready to serve' }).click()
      await expect(card).toHaveCount(0)
      await tablet.context().close()

      // The office: the guests had gone, and a manager voids the plate from the order's details,
      // with the change log under it.
      await page.context().clearCookies()
      await signInAs(page, 'manager', manager.email, { mfa: false })
      await page.goto(`/manager/restaurants/${dish.restaurantId}/orders`)
      await page.getByRole('row').filter({ hasText: `#${sent.number}` }).click()
      const details = page.getByRole('dialog')
      await expect(details.getByRole('button', { name: `Void ${dish.name}` })).toBeVisible()
      await expect(details).toContainText('Removed 1')
      await expectNoSeriousA11yViolations(page, 'manager: an order’s details and change log')
      await details.getByRole('button', { name: `Void ${dish.name}` }).click()
      await expectNoSeriousA11yViolations(page, 'manager: the void’s reason picker')
      await details.getByRole('button', { name: 'Took too long' }).click()
      await expect(details).toContainText(`Voided 1 ${dish.name}`)
      const voided = await db().order.findUniqueOrThrow({ where: { id: sent.id }, include: { lines: true } })
      expect(voided).toMatchObject({ status: 'CANCELLED', lines: [expect.objectContaining({ quantity: 2, removedQuantity: 2 })] })
      expect(voided.subtotal.toFixed(2)).toBe('0.00')
    } finally {
      await clearTable()
      await dish.remove()
      await waiter.remove()
      await kitchen.remove()
      await manager.remove()
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
