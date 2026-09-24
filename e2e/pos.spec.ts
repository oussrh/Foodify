import { expect, test, type Page } from '@playwright/test'
import { expectNoSeriousA11yViolations } from './axe'
import { ownRestaurant } from './manager'
import { auditAccount, db, signInAs } from './session'

// Settings → Integrations end to end, on a restaurant of the test's own: a super admin switches
// POS on (the owner cannot), the owner connects the Test POS, chooses a location, matches the
// dishes and activates it, and a guest's order then shows on the health panel as sent. Each screen
// of the panel is scanned with axe on the way. The server runs with a sealing key of the suite's
// own (playwright.config.ts).

/**
 * Scans the panel once the toasts are gone: a toast fading in is scanned half transparent, and
 * reads as a contrast failure that no one ever sees.
 */
async function scanPanel(page: Page, where: string) {
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 10_000 })
  await expectNoSeriousA11yViolations(page, where)
}

/** Opens Settings → Integrations of `restaurantId` in `portal`. */
async function openIntegrations(page: Page, portal: 'admin' | 'manager', restaurantId: string) {
  await page.goto(`/${portal}/restaurants/${restaurantId}/edit`)
  await page.getByRole('tab', { name: 'Integrations' }).click()
  await expect(page.getByRole('heading', { name: 'Point of sale' })).toBeVisible()
}

test.describe('connecting a POS', () => {
  test('a super admin switches it on, the owner connects the Test POS, and an order reaches it', async ({ page }, info) => {
    test.setTimeout(180_000)
    const restaurant = await ownRestaurant(info)
    await db().restaurant.update({ where: { id: restaurant.id }, data: { orderingEnabled: true } })
    const harira = await db().dish.create({
      data: { restaurantId: restaurant.id, subcategoryId: restaurant.subcategoryId, nameEn: 'Harira', nameFr: 'Harira', descriptionEn: '', descriptionFr: '', price: '4.50', imageUrl: '/images/chicken.svg', usdzUrl: '', glbUrl: '', sortOrder: 0 },
      select: { id: true },
    })
    const admin = await auditAccount('admin', `${info.testId}-a`, { mfa: false })
    const owner = await auditAccount('manager', `${info.testId}-m`, { mfa: false, restaurantId: restaurant.id })
    try {
      await signInAs(page, 'admin', admin.email, { mfa: false })
      await openIntegrations(page, 'admin', restaurant.id)
      await expect(page.getByText('POS integration isn’t included for this restaurant. Contact support.')).toBeVisible()
      await scanPanel(page, 'integrations: admin, POS off')
      await page.getByLabel('Include POS integration').check()
      await expect.poll(async () => (await db().restaurant.findUniqueOrThrow({ where: { id: restaurant.id } })).posEnabled).toBe(true)

      await page.context().clearCookies()
      await signInAs(page, 'manager', owner.email, { mfa: false })
      await openIntegrations(page, 'manager', restaurant.id)
      await expect(page.getByLabel('Include POS integration')).toHaveCount(0)
      await expect(page.getByText('Coming soon', { exact: true })).toHaveCount(3)
      await scanPanel(page, 'integrations: providers')

      await page.getByRole('button', { name: 'Connect Test POS' }).click()
      await page.getByLabel('API key').fill('test_e2e_key')
      await scanPanel(page, 'integrations: connect')
      await page.getByRole('button', { name: 'Connect', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Where should tickets go?' })).toBeVisible()
      await scanPanel(page, 'integrations: location')
      await page.getByRole('button', { name: 'Test connection' }).click()
      await expect(page.getByText('The POS answered')).toBeVisible()
      await page.getByLabel('Dining room').check()
      await page.getByRole('button', { name: 'Continue' }).click()

      await expect(page.getByRole('heading', { name: 'Match your dishes' })).toBeVisible()
      await expect(page.getByText('Suggested: Harira · 4.50')).toBeVisible()
      await scanPanel(page, 'integrations: matching')
      await page.getByRole('button', { name: 'Map all suggested' }).click()
      await expect(page.getByLabel('POS item for Harira')).toHaveValue('tpos-item-harira')
      await page.getByRole('button', { name: 'Save and activate' }).click()
      await expect(page.getByText('Sending', { exact: true })).toBeVisible()
      await scanPanel(page, 'integrations: health')

      const placed = await page.request.post('/api/orders', { data: { restaurantId: restaurant.id, table: '3', phone: '+212600112233', lines: [{ dishId: harira.id, quantity: 1 }] } })
      expect(placed.status()).toBe(201)
      // Sent right after the order's response; the panel reads it on the next load.
      await expect(async () => {
        await page.reload()
        await page.getByRole('tab', { name: 'Integrations' }).click()
        await expect(page.getByTestId('pos-sent')).toHaveText('1', { timeout: 2_000 })
      }).toPass({ timeout: 30_000 })
      await expect(page.getByTestId('pos-waiting')).toHaveText('0')
      const row = await db().posOutbox.findFirstOrThrow({ where: { restaurantId: restaurant.id }, select: { status: true, externalId: true, lastAnswer: true } })
      expect(row).toMatchObject({ status: 'SENT', externalId: expect.stringMatching(/^tpos-ticket-/), lastAnswer: expect.stringMatching(/^Received ticket #\d+ for table 3/) })
    } finally {
      await owner.remove()
      await admin.remove()
      await restaurant.remove()
    }
  })
})
