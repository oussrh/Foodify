import { describe, expect, it } from 'vitest'
import { Prisma, type Dish, type Ingredient } from '@/generated/prisma/client'
import { serializeDish } from './menu-data'

const row = (price: string): Dish & { ingredients: Ingredient[] } =>
  ({
    id: 'd1',
    nameEn: 'Tagine',
    nameFr: 'Tajine',
    descriptionEn: '',
    descriptionFr: null,
    price: new Prisma.Decimal(price),
    imageUrl: '/t.jpg',
    usdzUrl: '',
    glbUrl: null,
    calories: null,
    isMostPurchased: false,
    dietary: ['halal'],
    allergens: [],
    ingredients: [],
  }) as unknown as Dish & { ingredients: Ingredient[] }

describe('serializeDish', () => {
  it('sends the price as an exact two-decimal string, never a float', () => {
    expect(serializeDish(row('12.5')).price).toBe('12.50')
    expect(serializeDish(row('0.1')).price).toBe('0.10')
    expect(typeof serializeDish(row('7')).price).toBe('string')
  })

  it('turns empty strings into nulls and keeps the vocabulary keys', () => {
    const dish = serializeDish(row('1'))
    expect(dish).toMatchObject({ descriptionEn: null, descriptionFr: null, usdzUrl: null, glbUrl: null, dietary: ['halal'] })
  })
})
