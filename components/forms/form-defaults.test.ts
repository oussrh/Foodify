import { describe, expect, it } from 'vitest'
import { dishRow, restaurantRow } from '@/test/factories/prisma'
import { dishFormValues, restaurantFormValues } from './form-defaults'

describe('restaurantFormValues', () => {
  it('turns every empty column into an empty string and a stored theme into the form choice', () => {
    expect(restaurantFormValues(restaurantRow())).toEqual({
      name: 'Chez Test',
      slug: 'chez-test',
      email: '',
      phone: '',
      tagline: '',
      logoUrl: '',
      colorTheme: '',
      defaultLocale: 'en',
      streetAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      website: '',
      description: '',
      cuisineType: '',
      dietaryOptions: ['vegetarian', 'vegan', 'halal', 'gluten_free', 'spicy'],
      orderingEnabled: false,
      tableCount: 0,
      timeZone: 'UTC',
      openingHours: '',
      socialMedia: '',
      socialDisplay: 'icons',
      coverImageUrl: '',
      // Not null: a null here failed the settings form's schema and blocked every save.
      coverImageStyle: 'cover',
      secondaryColor: '',
      fontFamily: '',
      googleFontUrl: '',
      menuTheme: 'system',
      currency: '',
      currencySymbol: '',
    })
  })

  it('carries every stored value through unchanged', () => {
    const row = restaurantRow({
      email: 'hi@chez.test',
      phone: '+212 5',
      tagline: 'Slow food',
      logoUrl: '/logo.png',
      colorTheme: '#123456',
      defaultLocale: 'fr',
      streetAddress: '1 rue',
      city: 'Fes',
      state: 'Fes-Meknes',
      postalCode: '30000',
      country: 'MA',
      website: 'https://chez.test',
      description: 'A place',
      cuisineType: 'Moroccan',
      dietaryOptions: ['halal', 'vegan'],
      orderingEnabled: true,
      tableCount: 18,
      timeZone: 'UTC',
      openingHours: '{"days":{}}',
      socialMedia: '{"instagram":"chez"}',
      socialDisplay: 'icons',
      coverImageUrl: '/cover.jpg',
      coverImageStyle: 'repeat',
      secondaryColor: '#654321',
      fontFamily: 'Lora',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lora',
      menuTheme: 'dark',
      currency: 'MAD',
      currencySymbol: 'DH',
    })
    expect(restaurantFormValues(row)).toEqual({
      name: 'Chez Test',
      slug: 'chez-test',
      email: 'hi@chez.test',
      phone: '+212 5',
      tagline: 'Slow food',
      logoUrl: '/logo.png',
      colorTheme: '#123456',
      defaultLocale: 'fr',
      streetAddress: '1 rue',
      city: 'Fes',
      state: 'Fes-Meknes',
      postalCode: '30000',
      country: 'MA',
      website: 'https://chez.test',
      description: 'A place',
      cuisineType: 'Moroccan',
      dietaryOptions: ['halal', 'vegan'],
      orderingEnabled: true,
      tableCount: 18,
      timeZone: 'UTC',
      openingHours: '{"days":{}}',
      socialMedia: '{"instagram":"chez"}',
      socialDisplay: 'icons',
      coverImageUrl: '/cover.jpg',
      coverImageStyle: 'repeat',
      secondaryColor: '#654321',
      fontFamily: 'Lora',
      googleFontUrl: 'https://fonts.googleapis.com/css2?family=Lora',
      menuTheme: 'dark',
      currency: 'MAD',
      currencySymbol: 'DH',
    })
  })

  it('falls back to the system theme for a value the form does not offer', () => {
    expect(restaurantFormValues(restaurantRow({ menuTheme: 'sepia' })).menuTheme).toBe('system')
    expect(restaurantFormValues(restaurantRow({ menuTheme: 'light' })).menuTheme).toBe('light')
  })
})

describe('dishFormValues', () => {
  it('formats the price with two decimals and empties what the row does not have', () => {
    expect(dishFormValues(dishRow())).toEqual({
      nameEn: 'Tagine',
      nameFr: 'Tajine',
      descriptionEn: '',
      descriptionFr: '',
      price: '12.50',
      imageUrl: '/t.jpg',
      usdzUrl: '',
      glbUrl: '',
      subcategoryId: '',
      calories: undefined,
      isMostPurchased: false,
      dietary: ['halal'],
      allergens: [],
    })
  })

  it('carries the AR files, the subcategory, the calories and the flags through', () => {
    const row = dishRow({ usdzUrl: '/ar/t.usdz', glbUrl: '/ar/t.glb', subcategoryId: 's1', calories: 640, isMostPurchased: true, allergens: ['nuts'] })
    expect(dishFormValues(row)).toMatchObject({ usdzUrl: '/ar/t.usdz', glbUrl: '/ar/t.glb', subcategoryId: 's1', calories: 640, isMostPurchased: true, allergens: ['nuts'] })
  })
})
