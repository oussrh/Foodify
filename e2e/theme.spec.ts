import { expect, test, type Page } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'
import { deviceAccount, signInDevice } from './staff'

// The two theme scopes (components/theme-provider.tsx). The bug this guards: a kitchen tablet or a
// waiter's phone in dark mode opened the staff apps dark, with no way to switch. Staff screens
// start light whatever the device prefers; a device changes it in its "This device" sheet (the
// sign-in pages have a corner switch) and remembers it; the guest menu still follows the device.
// Every test here runs with the browser asking for dark.

test.use({ colorScheme: 'dark' })

const html = (page: Page) => page.locator('html')

/** Opens "This device" once the page has hydrated (a click before then opens nothing) and returns its theme group. */
async function openThemeRow(page: Page) {
  const sheet = page.getByRole('dialog', { name: 'This device' })
  await expect(async () => {
    await page.getByRole('button', { name: 'Settings for this device' }).click()
    await expect(sheet).toBeVisible({ timeout: 1_000 })
  }).toPass()
  return { sheet, theme: sheet.getByRole('group', { name: 'Theme' }) }
}

for (const portal of ['kitchen', 'waiter'] as const) {
  test(`the ${portal} app is light on a dark device, and dark chosen in its device sheet survives a reload`, async ({ page }, info) => {
    const device = await deviceAccount(portal === 'kitchen' ? 'KITCHEN' : 'WAITER', info)
    try {
      await page.goto(`/${portal}/login`)
      // One light browser bar, not the device's light/dark pair (lib/staff-viewport.ts).
      await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1)
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#FAFAF8')
      await expect(html(page)).not.toHaveClass(/\bdark\b/)
      await signInDevice(page, portal, device.username)
      await expect(html(page)).not.toHaveClass(/\bdark\b/)
      // The choice lives in the device sheet only: the header carries no theme switch.
      await expect(page.getByRole('button', { name: /Switch to (dark|light) mode/ })).toHaveCount(0)

      const { sheet, theme } = await openThemeRow(page)
      await expect(theme.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
      await theme.getByRole('button', { name: 'Follow the device' }).click()
      await expect(html(page)).toHaveClass(/\bdark\b/)
      await expect(sheet.getByText('Following the device: dark right now')).toBeVisible()
      await theme.getByRole('button', { name: 'Dark' }).click()
      await expect(theme.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
      await expectNoSeriousA11yViolations(page, `the ${portal} device sheet in dark`)
      await sheet.getByRole('button', { name: 'Done' }).click()
      await expectNoSeriousA11yViolations(page, `the ${portal} app in dark`)

      await page.reload()
      await expect(html(page)).toHaveClass(/\bdark\b/)
      expect(await page.evaluate(() => window.localStorage.getItem('foodify-theme'))).toBe('dark')
    } finally {
      await device.remove()
    }
  })
}

test("the waiter's Orders tab has the same device settings, the theme included", async ({ page }, info) => {
  // Reported by the owner: the settings lived on the Tables tab only, so a waiter on Orders had no
  // way to reach the theme.
  const device = await deviceAccount('WAITER', info)
  try {
    await signInDevice(page, 'waiter', device.username)
    await page.getByRole('link', { name: 'Orders' }).click()
    await expect(page).toHaveURL(/\/waiter\/[^/]+\/orders$/)
    const { sheet, theme } = await openThemeRow(page)
    await theme.getByRole('button', { name: 'Dark' }).click()
    await expect(html(page)).toHaveClass(/\bdark\b/)
    await expectNoSeriousA11yViolations(page, 'the waiter Orders device sheet in dark')
    await sheet.getByRole('button', { name: 'Done' }).click()
  } finally {
    await device.remove()
  }
})

test('the guest menu still follows a dark device', async ({ page }) => {
  await page.goto('/restaurant/foodify-test-kitchen')
  await expect(html(page)).toHaveClass(/\bdark\b/)
  // Its own choice, under its own key: the staff one is untouched.
  expect(await page.evaluate(() => window.localStorage.getItem('foodify-theme'))).toBeNull()
})
