// test/factories/menu.ts
// Builders for the customer-menu types (lib/menu.ts). Every field has a plain default; a test
// overrides only what it is about.
import type { MenuCategory, MenuDish, MenuRestaurant, MenuSubcategory } from '@/lib/menu'

/** A dish with no AR asset, no calories, no dietary or allergen flags. */
export function makeDish(overrides: Partial<MenuDish> = {}): MenuDish {
  return {
    id: 'dish-1',
    nameEn: 'Tagine',
    nameFr: 'Tajine',
    descriptionEn: 'Slow-cooked lamb',
    descriptionFr: "Agneau mijoté",
    price: '12.50',
    imageUrl: 'https://img.example/tagine.jpg',
    usdzUrl: null,
    glbUrl: null,
    calories: null,
    isMostPurchased: false,
    dietary: [],
    allergens: [],
    ingredients: [],
    ...overrides,
  }
}

/** Ships ONE dish by default: pass `dishes: []` for an empty section. */
export function makeSubcategory(overrides: Partial<MenuSubcategory> = {}): MenuSubcategory {
  return { id: 'sub-1', nameEn: 'Mains', nameFr: 'Plats', dishes: [makeDish()], ...overrides }
}

/** Ships ONE subcategory with one dish by default: a populated tree, not an empty one. */
export function makeCategory(overrides: Partial<MenuCategory> = {}): MenuCategory {
  return { id: 'cat-1', nameEn: 'Food', nameFr: 'Cuisine', subcategories: [makeSubcategory()], ...overrides }
}

/** Euro-priced, English by default, no address, hours or social links. */
export function makeRestaurant(overrides: Partial<MenuRestaurant> = {}): MenuRestaurant {
  return {
    id: 'rest-1',
    name: 'Dar Zitoun',
    slug: 'dar-zitoun',
    tagline: null,
    logoUrl: null,
    coverImageUrl: null,
    coverImageStyle: 'cover',
    menuTheme: 'system',
    colorTheme: null,
    defaultLocale: 'en',
    fontFamily: null,
    googleFontUrl: null,
    currencySymbol: '€',
    currency: 'EUR',
    cuisineType: null,
    city: null,
    streetAddress: null,
    state: null,
    postalCode: null,
    country: null,
    phone: null,
    email: null,
    website: null,
    openingHours: null,
    socialMedia: null,
    dietaryOptions: ['vegetarian', 'vegan', 'halal', 'gluten_free', 'spicy'],
    orderingEnabled: false,
    socialDisplay: 'icons',
    ...overrides,
  }
}
