import { expect, test } from '@playwright/test'
import { auditAccount, db, PASSWORD, signInAs, submitUntil } from './session'

// The Account page, as the person it belongs to uses it: the second factor turned off takes
// effect at the next sign-in, and a changed password is the one that works afterwards (and the
// old one is refused). Each test signs in as an account of its own and removes it.

test.describe('a manager\'s account', () => {
  test('turns the second factor off, and the next sign-in takes the password alone', async ({ page }, info) => {
    const account = await auditAccount('manager', info.testId)
    try {
      await signInAs(page, 'manager', account.email)
      await page.goto('/manager/profile')
      const mfa = page.locator('#mfa-enabled')
      await expect(mfa).toBeChecked()
      await mfa.click()
      await expect.poll(async () => (await db().user.findUniqueOrThrow({ where: { email: account.email } })).mfaEnabled).toBe(false)

      await page.context().clearCookies()
      await signInAs(page, 'manager', account.email, { mfa: false })
    } finally {
      await account.remove()
    }
  })

  test('changes the password: the new one signs in, the old one is refused', async ({ page }, info) => {
    const account = await auditAccount('manager', info.testId, { mfa: false })
    const fresh = 'Fresh-Pass-2026'
    const signInWith = async (password: string) => {
      await page.context().clearCookies()
      await page.goto('/manager/login')
      await page.getByLabel(/email/i).fill(account.email)
      await page.getByLabel(/password/i).fill(password)
    }
    try {
      await signInAs(page, 'manager', account.email, { mfa: false })
      await page.goto('/manager/profile')
      await page.locator('#currentPassword').fill(PASSWORD)
      await page.locator('#password').fill(fresh)
      await page.locator('#confirm').fill(fresh)
      await page.getByRole('button', { name: 'Update password' }).click()
      await expect(page.getByText('Password updated.')).toBeVisible()

      await signInWith(PASSWORD)
      const refused = page.getByRole('alert').filter({ hasText: 'Invalid email or password' })
      await submitUntil(page.getByRole('button', { name: /continue|sign in/i }), () => refused.isVisible())
      await expect(page).toHaveURL(/\/manager\/login$/)

      await signInWith(fresh)
      await submitUntil(page.getByRole('button', { name: /continue|sign in/i }), async () => !page.url().includes('/login'))
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    } finally {
      await account.remove()
    }
  })
})
