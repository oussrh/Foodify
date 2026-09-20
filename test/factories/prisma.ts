// test/factories/prisma.ts
// Rows as Prisma returns them, for the serializers. Every column present so a fixture never
// hides a missing field behind a cast.
import { Prisma, type Dish, type Ingredient, type Restaurant } from '@/generated/prisma/client'

const now = new Date('2026-09-20T12:00:00Z')

export function dishRow(overrides: Partial<Dish> & { ingredients?: Ingredient[] } = {}): Dish & { ingredients: Ingredient[] } {
  return {
    id: 'd1',
    nameEn: 'Tagine',
    nameFr: 'Tajine',
    descriptionEn: '',
    descriptionFr: '',
    price: new Prisma.Decimal('12.50'),
    imageUrl: '/t.jpg',
    usdzUrl: '',
    glbUrl: '',
    restaurantId: 'r1',
    subcategoryId: null,
    sortOrder: 0,
    isActive: true,
    isMostPurchased: false,
    calories: null,
    dietary: ['halal'],
    allergens: [],
    createdAt: now,
    ingredients: [],
    ...overrides,
  }
}

export function restaurantRow(overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: 'r1',
    name: 'Chez Test',
    slug: 'chez-test',
    email: null,
    phone: null,
    tagline: null,
    logoUrl: null,
    colorTheme: null,
    defaultLocale: 'en',
    streetAddress: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    website: null,
    description: null,
    cuisineType: null,
    priceRange: null,
    openingHours: null,
    socialMedia: null,
    coverImageUrl: null,
    coverImageStyle: null,
    secondaryColor: null,
    fontFamily: null,
    googleFontUrl: null,
    menuTheme: 'system',
    currency: null,
    currencySymbol: null,
    createdAt: now,
    ...overrides,
  }
}
