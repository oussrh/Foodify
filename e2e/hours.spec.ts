import { expect, test, type Page } from '@playwright/test'
import { auditAccount, seededIds, signInAs } from './session'

// The opening-hours editor's "Copy" popover: set one day, then copy its hours to the days you
// pick (not every day). Nothing is saved here — the test checks the form's state after the copy.
// It starts by closing the three days it reads, in the form only: the seeded restaurant's saved
// hours are whatever the last person to edit them left, and a test that assumed them failed the
// day somebody opened a Tuesday.

/** Closes a day in the form if it is open. */
async function closeDay(page: Page, day: string) {
  const open = page.getByRole('switch', { name: new RegExp(`${day} open`, 'i') })
  if ((await open.getAttribute('aria-checked')) === 'true') await open.click()
  await expect(open).not.toBeChecked()
}
test.describe('opening hours', () => {
  test('copies a day\'s hours to the days picked in the Copy popover', async ({ page }, info) => {
    test.setTimeout(120_000)
    const { restaurantCode } = await seededIds()
    const account = await auditAccount('manager', info.testId)
    await signInAs(page, 'manager', account.email)

    await page.goto(`/manager/restaurants/${restaurantCode}/edit`)
    await page.getByRole('tab', { name: 'Contact & hours' }).click()
    for (const day of ['monday', 'tuesday', 'wednesday']) await closeDay(page, day)

    // Open Monday, then copy its hours to Tuesday only.
    await page.getByRole('switch', { name: /monday open/i }).click()
    await expect(page.getByRole('switch', { name: /tuesday open/i })).not.toBeChecked()

    await page.getByRole('button', { name: /copy monday.*hours to other days/i }).click()
    await page.getByRole('menuitemcheckbox', { name: 'Tuesday' }).click()
    await page.getByRole('menuitem', { name: /copy to 1 day/i }).click()

    await expect(page.getByRole('switch', { name: /tuesday open/i })).toBeChecked()
    await expect(page.getByRole('switch', { name: /wednesday open/i })).not.toBeChecked()

    await account.remove()
  })
})
