import { expect, test } from '@playwright/test'
import { auditAccount, seededIds, signInAs } from './session'

// The opening-hours editor's "Copy" popover: set one day, then copy its hours to the days you
// pick (not every day). Nothing is saved here — the test checks the form's state after the copy.
test.describe('opening hours', () => {
  test('copies a day\'s hours to the days picked in the Copy popover', async ({ page }, info) => {
    test.setTimeout(120_000)
    const { restaurantId } = await seededIds()
    const account = await auditAccount('manager', info.testId)
    await signInAs(page, 'manager', account.email)

    await page.goto(`/manager/restaurants/${restaurantId}/edit`)
    await page.getByRole('tab', { name: 'Contact & hours' }).click()

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
