import { describe, expect, it } from 'vitest'
import { makeCategory, makeDish, makeRestaurant, makeSubcategory } from '@/test/factories/menu'
import { restaurantJsonLd } from './structured-data'

const origin = 'https://foodify.app'

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

  it('drops an empty section and appends uncategorized dishes as "Other dishes"', () => {
    const cat = makeCategory({ subcategories: [makeSubcategory({ dishes: [] })] })
    const sections = restaurantJsonLd(makeRestaurant(), [cat], [makeDish({ id: 'loose' })], origin).hasMenu.hasMenuSection
    expect(sections.map((s) => s.name)).toEqual(['Other dishes'])
    expect(sections[0].hasMenuItem[0].url).toBe('https://foodify.app/restaurant/dar-zitoun/dish/loose')
  })

  it('prices each item with two decimals and the restaurant currency', () => {
    const item = restaurantJsonLd(makeRestaurant({ currency: 'MAD' }), [makeCategory()], [], origin).hasMenu.hasMenuSection[0].hasMenuItem[0]
    expect(item.offers).toEqual({ '@type': 'Offer', price: '12.50', priceCurrency: 'MAD' })
  })

  it('maps stored dietary keys to schema.org diets and skips ones schema.org lacks', () => {
    const dish = makeDish({ dietary: ['vegan', 'spicy', 'gluten_free'] })
    const item = restaurantJsonLd(makeRestaurant(), [makeCategory({ subcategories: [makeSubcategory({ dishes: [dish] })] })], [], origin).hasMenu.hasMenuSection[0].hasMenuItem[0]
    expect(item.suitableForDiet).toEqual(['https://schema.org/VeganDiet', 'https://schema.org/GlutenFreeDiet'])
  })

  it('states calories only when they are known', () => {
    const [withCal, without] = [makeDish({ id: 'a', calories: 640 }), makeDish({ id: 'b' })]
    const items = restaurantJsonLd(makeRestaurant(), [makeCategory({ subcategories: [makeSubcategory({ dishes: [withCal, without] })] })], [], origin).hasMenu.hasMenuSection[0].hasMenuItem
    expect(items[0].nutrition).toEqual({ '@type': 'NutritionInformation', calories: '640 calories' })
    expect(items[1].nutrition).toBeUndefined()
  })
})
