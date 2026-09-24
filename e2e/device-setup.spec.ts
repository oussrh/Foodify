import { expect, test } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'
import { deviceAccount, signInDevice } from './staff'

// What a kitchen tablet remembers about itself across a reload, and the sheet it is set up from.
// The bug this guards: "keep the screen awake" was held in memory only, so a reload — or the
// tablet restarting overnight — quietly let the screen sleep again. The same reload locks the
// audio until someone touches the screen, which the board now says instead of staying silent.

test.describe('the kitchen tablet as a device', () => {
  test('remembers "keep the screen awake" across a reload', async ({ page }, info) => {
    const kitchen = await deviceAccount('KITCHEN', info)
    try {
      await signInDevice(page, 'kitchen', kitchen.username)
      test.skip(!(await page.evaluate(() => 'wakeLock' in navigator)), 'this browser has no Screen Wake Lock API')

      const awake = page.getByRole('button', { name: 'Keep awake' })
      await expect(awake).toHaveAttribute('aria-pressed', 'false')
      // Pressed once the page has hydrated: a click that lands before then is not a toggle.
      await expect(async () => {
        if ((await awake.getAttribute('aria-pressed')) === 'false') await awake.click()
        await expect(awake).toHaveAttribute('aria-pressed', 'true', { timeout: 1_000 })
      }).toPass()

      await page.reload()
      await expect(awake).toHaveAttribute('aria-pressed', 'true')
      expect(await page.evaluate(() => window.localStorage.getItem('foodify-screen-awake'))).toBe('on')
    } finally {
      await kitchen.remove()
    }
  })

  test('asks for a tap to enable the sound after a load, and the tap anywhere clears it', async ({ page }, info) => {
    const kitchen = await deviceAccount('KITCHEN', info)
    try {
      await signInDevice(page, 'kitchen', kitchen.username)
      const strip = page.getByRole('button', { name: 'Tap anywhere to enable sound' })
      await expect(strip).toBeVisible()
      // Anywhere means anywhere: the heading is not a control.
      await page.getByRole('heading', { level: 1 }).click()
      await expect(strip).toHaveCount(0)
    } finally {
      await kitchen.remove()
    }
  })

  test('opens the device sheet from the board, and it passes axe', async ({ page }, info) => {
    const kitchen = await deviceAccount('KITCHEN', info)
    try {
      await signInDevice(page, 'kitchen', kitchen.username)
      const open = page.getByRole('button', { name: "This device's settings" })
      await expect(async () => {
        await open.click()
        await expect(page.getByRole('dialog', { name: 'This device' })).toBeVisible({ timeout: 1_000 })
      }).toPass()

      const sheet = page.getByRole('dialog', { name: 'This device' })
      await expect(sheet.getByText('Home screen app')).toBeVisible()
      await expect(sheet.getByText('Notifications', { exact: true })).toBeVisible()
      await expect(sheet.getByText('Sound', { exact: true })).toBeVisible()
      await expectNoSeriousA11yViolations(page, 'the device sheet on the kitchen board')

      await sheet.getByRole('button', { name: 'Done' }).click()
      await expect(sheet).toHaveCount(0)
    } finally {
      await kitchen.remove()
    }
  })
})
