import { expect, test } from '@playwright/test'
import { ownRestaurant } from './manager'
import { auditAccount, db, signInAs } from './session'

// A manager's menu, written through the portal and read back from the guest's side: a dish made
// in the create form appears on the public menu at its price, an edit to the price is what the
// guest then sees, and a delete from the dishes list takes it off. On a restaurant of the test's
// own (`e2e/manager.ts`), so the seeded menu every other spec reads is never touched. No photo:
// uploads go to Cloudinary, which the suite does not reach, and a dish is valid without one.

test.describe('a manager\'s menu', () => {
  test('a dish is created, repriced and deleted, and the public menu follows each step', async ({ page, browser }, info) => {
    test.setTimeout(120_000)
    const restaurant = await ownRestaurant(info)
    const manager = await auditAccount('manager', info.testId, { mfa: false, restaurantId: restaurant.id })
    const name = `Fattoush ${restaurant.slug}`
    const guestPrice = async (price: string) => {
      const guest = await browser.newPage()
      await guest.goto(`/restaurant/${restaurant.slug}?lang=en`)
      await expect(guest.getByRole('link', { name: new RegExp(name) }).first()).toContainText(price)
      await guest.close()
    }

    try {
      await signInAs(page, 'manager', manager.email, { mfa: false })

      await page.goto(`/manager/restaurants/${restaurant.id}/dishes/create`)
      await page.locator('#nameEn').fill(name)
      await page.locator('#nameFr').fill(name)
      await page.locator('#price').fill('12.50')
      await page.locator('#subcategory').selectOption(restaurant.subcategoryId)
      await page.getByRole('button', { name: 'Create Dish' }).click()
      await expect(page.getByText('Dish created successfully!')).toBeVisible()
      const dish = await db().dish.findFirstOrThrow({ where: { restaurantId: restaurant.id, nameEn: name } })
      expect(dish.price.toString()).toBe('12.5')
      expect(dish.subcategoryId).toBe(restaurant.subcategoryId)
      await guestPrice('€12.50')

      // Repriced from the dish's own row: the menu, then Edit, then the save bar.
      await page.goto(`/manager/restaurants/${restaurant.id}/dishes`)
      await page.getByRole('button', { name: `Actions for ${name}` }).click()
      await page.getByRole('menuitem', { name: 'Edit' }).click()
      await page.locator('#price').fill('14')
      await page.getByRole('button', { name: 'Save changes' }).click()
      await expect.poll(async () => (await db().dish.findUniqueOrThrow({ where: { id: dish.id } })).price.toString()).toBe('14')
      await guestPrice('€14.00')

      // Deleted behind its confirmation, and gone from the guest's menu.
      await page.goto(`/manager/restaurants/${restaurant.id}/dishes`)
      await page.getByRole('button', { name: `Actions for ${name}` }).click()
      await page.getByRole('menuitem', { name: 'Delete' }).click()
      await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
      await expect.poll(() => db().dish.count({ where: { id: dish.id } })).toBe(0)
      const guest = await browser.newPage()
      await guest.goto(`/restaurant/${restaurant.slug}?lang=en`)
      await expect(guest.getByRole('link', { name: new RegExp(name) })).toHaveCount(0)
      await guest.close()
    } finally {
      await manager.remove()
      await restaurant.remove()
    }
  })
})
