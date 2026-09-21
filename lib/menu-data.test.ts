import { describe, expect, it } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { categoryRow, dishRow, restaurantRow, subcategoryRow } from '@/test/factories/prisma'
import { serializeCategories, serializeDish, serializeRestaurant, siteOrigin } from './menu-data'

describe('serializeDish', () => {
  it('sends the price as an exact two-decimal string, never a float', () => {
    expect(serializeDish(dishRow({ price: new Prisma.Decimal('12.5') })).price).toBe('12.50')
    expect(serializeDish(dishRow({ price: new Prisma.Decimal('0.1') })).price).toBe('0.10')
    expect(typeof serializeDish(dishRow({ price: new Prisma.Decimal('7') })).price).toBe('string')
  })

  it('turns empty strings into nulls and keeps the vocabulary keys', () => {
    expect(serializeDish(dishRow())).toMatchObject({ descriptionEn: null, descriptionFr: null, usdzUrl: null, glbUrl: null, dietary: ['halal'] })
  })

  it('carries the ingredients as plain bilingual names', () => {
    const ingredient = { id: 'i1', dishId: 'd1', nameEn: 'Salt', nameFr: 'Sel', createdAt: new Date('2026-09-20T12:00:00Z') }
    expect(serializeDish(dishRow({ ingredients: [ingredient] })).ingredients).toEqual([{ id: 'i1', nameEn: 'Salt', nameFr: 'Sel' }])
  })
})

describe('serializeRestaurant', () => {
  it('reads the stored appearance strings into their vocabularies, with the safe value for anything else', () => {
    const plain = serializeRestaurant(restaurantRow())
    expect(plain).toMatchObject({ coverImageStyle: 'cover', menuTheme: 'system', defaultLocale: 'en', currencySymbol: '$', currency: null })
    const set = serializeRestaurant(restaurantRow({ coverImageStyle: 'repeat', menuTheme: 'dark', defaultLocale: 'fr', currencySymbol: 'DH', currency: 'MAD' }))
    expect(set).toMatchObject({ coverImageStyle: 'repeat', menuTheme: 'dark', defaultLocale: 'fr', currencySymbol: 'DH', currency: 'MAD' })
    expect(serializeRestaurant(restaurantRow({ coverImageStyle: 'tile', menuTheme: 'sepia' }))).toMatchObject({ coverImageStyle: 'cover', menuTheme: 'system' })
  })
})

describe('serializeCategories', () => {
  it('keeps the tree and both names, serializing every dish, and an empty section stays empty', () => {
    const category = categoryRow()
    const tree = [
      {
        ...category,
        subcategories: [
          { ...subcategoryRow({ nameEn: 'Grill' }), dishes: [dishRow({ id: 'd1', price: new Prisma.Decimal('9') })] },
          { ...subcategoryRow({ id: 's2', nameEn: 'Soups', nameFr: 'Soupes', sortOrder: 1 }), dishes: [] },
        ],
      },
      { ...category, id: 'c2', nameEn: 'Drinks', nameFr: 'Boissons', subcategories: [] },
    ]
    expect(serializeCategories(tree)).toEqual([
      {
        id: 'c1',
        nameEn: 'Mains',
        nameFr: 'Plats',
        subcategories: [
          { id: 's1', nameEn: 'Grill', nameFr: 'Grillades', dishes: [serializeDish(dishRow({ id: 'd1', price: new Prisma.Decimal('9') }))] },
          { id: 's2', nameEn: 'Soups', nameFr: 'Soupes', dishes: [] },
        ],
      },
      { id: 'c2', nameEn: 'Drinks', nameFr: 'Boissons', subcategories: [] },
    ])
  })
})

describe('siteOrigin', () => {
  it('is the public origin the links off-site use', () => {
    expect(siteOrigin()).toMatch(/^https?:\/\//)
  })
})
