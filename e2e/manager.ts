// e2e/manager.ts
// A restaurant of the test's own, for the specs that change what a manager can change: its
// settings, its menu, its people. The seeded restaurant is read by every other spec — the menu
// journey, ordering, the staff screens — so a spec that saved its settings or deleted one of its
// dishes would break them, and the phone and desktop projects would break each other. One
// category with one subcategory, so a dish has somewhere to go; ordering off, as a new
// restaurant starts, and no cover style: a NULL there once made the settings unsavable, and the
// settings spec is the guard. `remove` deletes it, and the delete cascades to its menu, dishes and orders.
import type { TestInfo } from '@playwright/test'
import { newRestaurantCode } from '../lib/restaurant-code'
import { db } from './session'
import { runTag } from './staff'

/** A fresh restaurant with a Starters → Salads section, named after this test in this project. */
export async function ownRestaurant(info: TestInfo) {
  const tag = runTag(info)
  const slug = `e2e-${tag}`
  await db().restaurant.deleteMany({ where: { slug } })
  const restaurant = await db().restaurant.create({
    data: {
      name: `E2E Bistro ${tag}`,
      slug,
      code: newRestaurantCode(),
      defaultLocale: 'en',
      currency: 'EUR',
      currencySymbol: '€',
      categories: {
        create: {
          nameEn: 'Starters',
          nameFr: 'Entrées',
          sortOrder: 0,
          subcategories: { create: { nameEn: 'Salads', nameFr: 'Salades', sortOrder: 0 } },
        },
      },
    },
    select: { id: true, code: true, slug: true, name: true, categories: { select: { subcategories: { select: { id: true } } } } },
  })
  const subcategoryId = restaurant.categories[0]?.subcategories[0]?.id
  if (!subcategoryId) throw new Error('e2e: the test restaurant was created without its subcategory')
  return { id: restaurant.id, code: restaurant.code, slug, name: restaurant.name, subcategoryId, remove: () => db().restaurant.deleteMany({ where: { slug } }) }
}
