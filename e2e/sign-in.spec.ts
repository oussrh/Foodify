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

  test('an /mfa visit with nothing pending returns to the login', async ({ page }) => {
    await page.goto('/manager/mfa')
    await expect(page).toHaveURL(/\/manager\/login$/)
  })
})
