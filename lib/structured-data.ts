// lib/structured-data.ts
// schema.org Restaurant + Menu JSON-LD for the public page. Search engines and assistants read
// this; it costs nothing on screen.
import type { MenuCategory, MenuDish, MenuRestaurant } from './menu'
import { DAY_KEYS, hasStructuredHours, parseOpeningHours, type DayKey } from './opening-hours'

const SCHEMA_DAY: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

function menuItem(dish: MenuDish, restaurant: MenuRestaurant, origin: string) {
  return {
    '@type': 'MenuItem',
    name: dish.nameEn,
    description: dish.descriptionEn || undefined,
    image: dish.imageUrl,
    url: `${origin}/restaurant/${restaurant.slug}/dish/${dish.id}`,
    offers: {
      '@type': 'Offer',
      price: dish.price,
      priceCurrency: restaurant.currency || undefined,
    },
    nutrition: dish.calories !== null ? { '@type': 'NutritionInformation', calories: `${dish.calories} calories` } : undefined,
    suitableForDiet: dish.dietary
      .map((d) => ({ vegetarian: 'VegetarianDiet', vegan: 'VeganDiet', halal: 'HalalDiet', gluten_free: 'GlutenFreeDiet' })[d])
      .filter(Boolean)
      .map((d) => `https://schema.org/${d}`),
  }
}

export function restaurantJsonLd(restaurant: MenuRestaurant, categories: MenuCategory[], uncategorized: MenuDish[], origin: string) {
  const hours = parseOpeningHours(restaurant.openingHours)
  const url = `${origin}/restaurant/${restaurant.slug}`

  const openingHoursSpecification = hasStructuredHours(hours)
    ? DAY_KEYS.flatMap((day) =>
        (hours.days[day] ?? []).map((p) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${SCHEMA_DAY[day]}`,
          opens: p.open,
          closes: p.close,
        })),
      )
    : undefined

  const sections = categories
    .flatMap((cat) =>
      cat.subcategories.map((sub) => ({
        '@type': 'MenuSection',
        name: sub.nameEn.toLowerCase() === cat.nameEn.toLowerCase() ? cat.nameEn : `${cat.nameEn} · ${sub.nameEn}`,
        hasMenuItem: sub.dishes.map((d) => menuItem(d, restaurant, origin)),
      })),
    )
    .filter((s) => s.hasMenuItem.length > 0)
  if (uncategorized.length > 0) {
    sections.push({ '@type': 'MenuSection', name: 'Other dishes', hasMenuItem: uncategorized.map((d) => menuItem(d, restaurant, origin)) })
  }

  const address =
    restaurant.streetAddress || restaurant.city
      ? {
          '@type': 'PostalAddress',
          streetAddress: restaurant.streetAddress || undefined,
          addressLocality: restaurant.city || undefined,
          addressRegion: restaurant.state || undefined,
          postalCode: restaurant.postalCode || undefined,
          addressCountry: restaurant.country || undefined,
        }
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': url,
    name: restaurant.name,
    url,
    image: restaurant.coverImageUrl || restaurant.logoUrl || undefined,
    logo: restaurant.logoUrl || undefined,
    description: restaurant.tagline || undefined,
    telephone: restaurant.phone ? restaurant.phone.replace(/[^\d+]/g, '') : undefined,
    email: restaurant.email || undefined,
    servesCuisine: restaurant.cuisineType || undefined,
    address,
    openingHoursSpecification,
    hasMenu: {
      '@type': 'Menu',
      name: `${restaurant.name} menu`,
      inLanguage: ['en', 'fr'],
      hasMenuSection: sections,
    },
  }
}
