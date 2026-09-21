import { describe, expect, it } from 'vitest'
import { makeCategory, makeDish, makeRestaurant, makeSubcategory } from '@/test/factories/menu'
import { restaurantJsonLd } from './structured-data'

const origin = 'https://foodify.app'

/** The dishes of the first section, none when there is no section. */
const firstSectionItems = (ld: ReturnType<typeof restaurantJsonLd>) => ld.hasMenu.hasMenuSection[0]?.hasMenuItem ?? []

/** The first dish of the first section: what most item-level assertions reach for. */
const firstItem = (ld: ReturnType<typeof restaurantJsonLd>) => {
  const [item] = firstSectionItems(ld)
  if (!item) throw new Error('the menu has no first item')
  return item
}

describe('restaurantJsonLd', () => {
  it('identifies the restaurant by its public URL', () => {
    const ld = restaurantJsonLd(makeRestaurant(), [], [], origin)
    expect(ld['@type']).toBe('Restaurant')
    expect(ld['@id']).toBe('https://foodify.app/restaurant/dar-zitoun')
    expect(ld.url).toBe(ld['@id'])
  })

  it('leaves out address and hours when the restaurant has none', () => {
    const ld = restaurantJsonLd(makeRestaurant(), [], [], origin)
    expect(ld.address).toBeUndefined()
    expect(ld.openingHoursSpecification).toBeUndefined()
  })

  it('emits one OpeningHoursSpecification per period from structured hours', () => {
    const openingHours = JSON.stringify({ days: { mon: [{ open: '12:00', close: '14:30' }, { open: '19:00', close: '23:00' }], sun: [] } })
    const ld = restaurantJsonLd(makeRestaurant({ openingHours }), [], [], origin)
    expect(ld.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Monday', opens: '12:00', closes: '14:30' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Monday', opens: '19:00', closes: '23:00' },
    ])
  })

  it('keeps legacy free-text hours out of the structured block', () => {
    expect(restaurantJsonLd(makeRestaurant({ openingHours: 'Open daily' }), [], [], origin).openingHoursSpecification).toBeUndefined()
  })

  it('strips the phone number down to digits and the plus sign', () => {
    expect(restaurantJsonLd(makeRestaurant({ phone: '+212 (0)5 24-12 34 56' }), [], [], origin).telephone).toBe('+2120524123456')
  })

  it('names a section after the category alone when the subcategory repeats it', () => {
    const cat = makeCategory({ nameEn: 'Desserts', subcategories: [makeSubcategory({ nameEn: 'desserts' }), makeSubcategory({ id: 'sub-2', nameEn: 'Ice cream' })] })
    const names = restaurantJsonLd(makeRestaurant(), [cat], [], origin).hasMenu.hasMenuSection.map((s) => s.name)
    expect(names).toEqual(['Desserts', 'Desserts · Ice cream'])
  })

  it('drops a section with no dishes', () => {
    const cat = makeCategory({ subcategories: [makeSubcategory({ dishes: [] })] })
    expect(restaurantJsonLd(makeRestaurant(), [cat], [], origin).hasMenu.hasMenuSection).toEqual([])
  })

  it('appends uncategorized dishes as "Other dishes" with their public URL', () => {
    const ld = restaurantJsonLd(makeRestaurant(), [], [makeDish({ id: 'loose' })], origin)
    expect(ld.hasMenu.hasMenuSection.map((s) => s.name)).toEqual(['Other dishes'])
    expect(firstItem(ld).url).toBe('https://foodify.app/restaurant/dar-zitoun/dish/loose')
  })

  it('prices each item with two decimals and the restaurant currency', () => {
    const item = firstItem(restaurantJsonLd(makeRestaurant({ currency: 'MAD' }), [makeCategory()], [], origin))
    expect(item.offers).toEqual({ '@type': 'Offer', price: '12.50', priceCurrency: 'MAD' })
  })

  const withDish = (dish: ReturnType<typeof makeDish>) =>
    restaurantJsonLd(makeRestaurant(), [makeCategory({ subcategories: [makeSubcategory({ dishes: [dish] })] })], [], origin)

  it('maps stored dietary keys to schema.org diets', () => {
    expect(firstItem(withDish(makeDish({ dietary: ['vegan', 'gluten_free'] }))).suitableForDiet).toEqual([
      'https://schema.org/VeganDiet',
      'https://schema.org/GlutenFreeDiet',
    ])
  })

  it('skips a dietary key schema.org has no diet for', () => {
    expect(firstItem(withDish(makeDish({ dietary: ['spicy'] }))).suitableForDiet).toEqual([])
  })

  it('states calories only when they are known', () => {
    const [withCal, without] = [makeDish({ id: 'a', calories: 640 }), makeDish({ id: 'b' })]
    const items = firstSectionItems(restaurantJsonLd(makeRestaurant(), [makeCategory({ subcategories: [makeSubcategory({ dishes: [withCal, without] })] })], [], origin))
    expect(items).toHaveLength(2)
    expect(items[0]?.nutrition).toEqual({ '@type': 'NutritionInformation', calories: '640 calories' })
    expect(items[1]?.nutrition).toBeUndefined()
  })
})
