import { expect, test, type Page } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'
import { db } from './session'

// The ordering journey on the seeded restaurant (prisma/seed.ts), which takes orders: add from a
// row, change the quantity in the sheet, send it with the table the QR link carried, and read
// the number back. The order the run places is removed after, so a re-run starts from the menu
// it found. The cart lives in localStorage, so each test gets its own context by default.

const MENU = '/restaurant/foodify-test-kitchen'
const SLUG = 'foodify-test-kitchen'

async function openMenu(page: Page, url: string) {
  await page.goto(url)
  await page.locator('[data-hydrated]').waitFor()
}

/**
 * The run's own table, short enough to be one. `orderTable` caps a table at 20 characters, which
 * is what a table number is; a Playwright test id is the whole test title and runs to eighty-odd,
 * so slugging it built a table the endpoint rightly refused (400, no order, and an assertion that
 * failed several steps later for a reason that looked nothing like the cause). Hashed, not
 * truncated: two projects run the same title and must not collide.
 */
function tableFor(testId: string): string {
  let hash = 7
  for (const char of testId) hash = Math.imul(hash, 31) + char.charCodeAt(0)
  return `e2e-${Math.abs(hash).toString(36)}`.slice(0, 20)
}

/** The orders this run placed, by the table it used; the table is the run's own so two workers never delete each other's. */
async function removeOrdersFor(table: string) {
  await db().order.deleteMany({ where: { table, restaurant: { slug: SLUG } } })
}

test.describe('ordering', () => {
  test('adds a dish from a row, changes it in the sheet, and sends the order with the table from the link', async ({ page }, info) => {
    const table = tableFor(info.testId)
    await openMenu(page, `${MENU}?lang=en&table=${table}`)

    // The row's + puts one in the order and then shows the count.
    const add = page.getByRole('button', { name: /^Add Grilled Chicken/ }).first()
    await add.click()
    await expect(page.getByRole('button', { name: /Add Grilled Chicken — 1 in your order/ }).first()).toBeVisible()

    // The sheet shows the stepper instead of "Add to order" once the dish is in, and takes the note.
    await page.getByRole('link', { name: /Grilled Chicken/ }).first().click()
    const sheet = page.getByRole('dialog')
    await sheet.getByRole('button', { name: /One more Grilled Chicken/ }).click()
    await sheet.getByRole('button', { name: /Add a note/ }).click()
    await sheet.getByLabel('Note for Grilled Chicken').fill('No onions')
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()

    // The bar counts what is in the order and opens it.
    const bar = page.getByRole('button', { name: /View order/ })
    await expect(bar).toContainText('2 items')
    await bar.click()

    const cart = page.getByRole('dialog')
    await expect(cart.getByRole('heading', { name: 'Your order' })).toBeVisible()
    // What was asked for on the dish came with it into the order.
    await expect(cart.getByRole('button', { name: /Note for Grilled Chicken/ })).toContainText('No onions')
    // The table came from the QR link, so it is shown rather than asked for.
    await expect(cart.getByLabel('Table number')).toHaveCount(0)
    await expect(cart.getByText(table, { exact: true })).toBeVisible()
    await cart.getByLabel('Phone number').fill('+212600112233')
    await expectNoSeriousA11yViolations(page, 'the order sheet')
    await cart.getByRole('button', { name: 'Place order' }).click()

    await expect(cart.getByText(/Order #\d+ sent/)).toBeVisible()
    await expect(cart.getByText(new RegExp(`table ${table}`))).toBeVisible()

    const order = await db().order.findFirstOrThrow({ where: { table, restaurant: { slug: SLUG } }, include: { lines: true } })
    expect(order.lines).toHaveLength(1)
    expect(order.lines[0]?.quantity).toBe(2)
    expect(order.lines[0]?.note).toBe('No onions')
    expect(order.phone).toBe('+212600112233')
    expect(order.status).toBe('NEW')

    // Back to the menu: the order was sent, so the bar is gone.
    await cart.getByRole('button', { name: /Back to menu/ }).click()
    await expect(page.getByRole('button', { name: /View order/ })).toBeHidden()

    await removeOrdersFor(table)
  })

  // The guest follows the order from their own phone: the page the sent screen links to moves with
  // the kitchen on its own, the menu carries a pill to it while it is being made, and both let go
  // once it is served. The kitchen's moves are written to the row, as the board's action would.
  test('follows the order it sent, on its own page and from the menu, until it is served', async ({ page }, info) => {
    const table = tableFor(info.testId)
    await openMenu(page, `${MENU}?lang=en&table=${table}`)
    await page.getByRole('button', { name: /^Add Grilled Chicken/ }).first().click()
    await page.getByRole('button', { name: /View order/ }).click()
    const cart = page.getByRole('dialog')
    await cart.getByLabel('Phone number').fill('+212600112233')
    await cart.getByRole('button', { name: 'Place order' }).click()
    await cart.getByRole('link', { name: 'Follow your order' }).click()

    await expect(page).toHaveURL(new RegExp(`/restaurant/${SLUG}/order/[A-Za-z0-9_-]{32}\\?lang=en$`))
    const order = await db().order.findFirstOrThrow({ where: { table, restaurant: { slug: SLUG } }, select: { id: true, number: true } })
    await expect(page.getByRole('heading', { level: 1, name: `Your order #${order.number}` })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText('Sent to the kitchen')
    await expect(page.getByText(`Table ${table}`)).toBeVisible()
    await expectNoSeriousA11yViolations(page, 'the order tracking page')

    // The kitchen starts it: the page hears it on its next poll, without a reload.
    await db().order.update({ where: { id: order.id }, data: { status: 'ACCEPTED', acceptedAt: new Date() } })
    await expect(page.getByRole('status')).toHaveText('Being prepared', { timeout: 15_000 })

    // Back on the menu, the pill says where it is and leads back to it.
    await page.getByRole('link', { name: /Back to menu/ }).click()
    const pill = page.getByRole('link', { name: `Your order #${order.number} · Being prepared` })
    await expect(pill).toBeVisible()
    await pill.click()
    await expect(page.getByRole('heading', { level: 1, name: `Your order #${order.number}` })).toBeVisible()

    // Served: the page says so, and the menu lets the order go.
    await db().order.update({ where: { id: order.id }, data: { status: 'DONE', readyAt: new Date(), servedAt: new Date() } })
    await page.reload()
    await expect(page.getByRole('status')).toHaveText('Served')
    await openMenu(page, `${MENU}?lang=en`)
    await expect(page.getByRole('link', { name: /^Your order #/ })).toBeHidden()

    await removeOrdersFor(table)
  })

  // Opened without the QR link, the table is asked for, and neither it nor the phone may be left out.
  test('refuses to send without a table number, then without a phone number', async ({ page }) => {
    await openMenu(page, `${MENU}?lang=en`)
    await page.getByRole('button', { name: /^Add Grilled Chicken/ }).first().click()
    await page.getByRole('button', { name: /View order/ }).click()
    const cart = page.getByRole('dialog')
    await expect(cart.getByLabel('Table number')).toHaveValue('')
    await cart.getByRole('button', { name: 'Place order' }).click()
    await expect(cart.getByRole('alert')).toHaveText('Enter your table number.')

    await cart.getByLabel('Table number').fill('4')
    await cart.getByRole('button', { name: 'Place order' }).click()
    await expect(cart.getByRole('alert')).toHaveText('Enter a phone number we can text.')
    // Still in the order, nothing sent.
    await expect(cart.getByRole('button', { name: 'Place order' })).toBeVisible()
  })
})
