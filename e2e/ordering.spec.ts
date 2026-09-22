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
