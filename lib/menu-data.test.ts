import { describe, expect, it } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { dishRow } from '@/test/factories/prisma'
import { serializeDish } from './menu-data'

describe('serializeDish', () => {
  it('sends the price as an exact two-decimal string, never a float', () => {
    expect(serializeDish(dishRow({ price: new Prisma.Decimal('12.5') })).price).toBe('12.50')
    expect(serializeDish(dishRow({ price: new Prisma.Decimal('0.1') })).price).toBe('0.10')
    expect(typeof serializeDish(dishRow({ price: new Prisma.Decimal('7') })).price).toBe('string')
  })

  it('turns empty strings into nulls and keeps the vocabulary keys', () => {
    expect(serializeDish(dishRow())).toMatchObject({ descriptionEn: null, descriptionFr: null, usdzUrl: null, glbUrl: null, dietary: ['halal'] })
  })
})
