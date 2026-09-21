import { expect, test, type Page } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'

// The seeded restaurant (prisma/seed.ts). The journey a guest takes from a QR code.
const MENU = '/restaurant/foodify-test-kitchen'

/** The rows are real links until React attaches its handlers; the page marks itself once hydrated. */
async function openMenu(page: Page, url = MENU) {
  await page.goto(url)
  await page.locator('[data-hydrated]').waitFor()
}

test.describe('public menu', () => {
  test('loads with the restaurant name and at least one dish', async ({ page }) => {
    await openMenu(page)
    await expect(page).toHaveTitle(/Foodify Test Kitchen/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Foodify Test Kitchen')
    await expect(page.getByRole('link', { name: /Poulet grillé|Grilled Chicken/ }).first()).toBeVisible()
  })

  test('switches language from the toggle and remembers it', async ({ page }) => {
    await openMenu(page, `${MENU}?lang=en`)
    await expect(page.getByRole('searchbox', { name: 'Search menu' })).toBeVisible()
    await page.getByRole('button', { name: 'Français' }).click()
    await expect(page.getByRole('searchbox', { name: 'Rechercher' })).toBeVisible()
    await page.goto(MENU)
    await expect(page.getByRole('searchbox', { name: 'Rechercher' })).toBeVisible()
  })

  test('opens a dish sheet from a row and closes it with the back button', async ({ page }) => {
    await openMenu(page, `${MENU}?lang=en`)
    await page.getByRole('link', { name: /Grilled Chicken/ }).first().click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByRole('heading', { name: /Grilled Chicken/ }).first()).toBeVisible()
    await page.goBack()
    await expect(sheet).toBeHidden()
  })

  test('opens a dish with a model on the 3D view and switches to the photo without a page error', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await openMenu(page, `${MENU}?lang=en`)
    await page.getByRole('link', { name: /Grilled Chicken/ }).first().click()
    const sheet = page.getByRole('dialog')
    // A dish with a GLB opens on the 3D view by default.
    await expect(sheet.locator('model-viewer')).toBeVisible()
    await sheet.getByRole('button', { name: /view the photo/i }).click()
    await expect(sheet.locator('model-viewer')).toBeHidden()
    await sheet.getByRole('button', { name: /view in 3d/i }).click()
    await expect(sheet.locator('model-viewer')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('highlights the last category in the bar when it is tapped', async ({ page }) => {
    await openMenu(page, `${MENU}?lang=en`)
    const chips = page.locator('nav[aria-label="Categories"] a[data-chip]')
    const last = chips.last()
    await last.click()
    // The tapped category becomes current even though it is the short last section.
    await expect(last).toHaveAttribute('aria-current', 'location')
  })

  test('has no serious accessibility violation, closed and with the sheet open', async ({ page }) => {
    await openMenu(page, `${MENU}?lang=en`)
    await expectNoSeriousA11yViolations(page)
    await page.getByRole('link', { name: /Grilled Chicken/ }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // the page behind the sheet is inert: hidden from assistive tech and out of the tab order
    await expect(page.locator('[data-hydrated]')).toHaveAttribute('inert', '')
    await expectNoSeriousA11yViolations(page)
  })
})
