import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'

test.describe('sign-in', () => {
  for (const portal of ['manager', 'admin'] as const) {
    test(`${portal} login page shows the credentials form and passes the accessibility scan`, async ({ page }) => {
      await page.goto(`/${portal}/login`)
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in|continue|log in/i })).toBeVisible()
      await expectNoSeriousA11yViolations(page)
    })
  }

  // The first step end to end: the seeded manager with a wrong password reaches the server
  // action (its zod parse, the account lookup, the compare) and the page shows the one message.
  test('a wrong password on the manager login is refused with the one message', async ({ page }) => {
    await page.goto('/manager/login')
    await page.getByLabel(/email/i).fill('owner@foodify.test')
    await page.getByLabel(/password/i).fill('not-the-password')
    await page.getByRole('button', { name: /sign in|continue|log in/i }).click()
    await expect(page.getByRole('alert').filter({ hasText: /./ })).toHaveText('Invalid email or password')
    await expect(page).toHaveURL(/\/manager\/login$/)
  })

  test('an /mfa visit with nothing pending returns to the login', async ({ page }) => {
    await page.goto('/manager/mfa')
    await expect(page).toHaveURL(/\/manager\/login$/)
  })
})
