import { describe, expect, it } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { categoryRow, dishRow, subcategoryRow } from '@/test/factories/prisma'
import { dishListRow } from './dish-list-rows'

const category = categoryRow()
const sub = (nameEn: string) => ({ ...subcategoryRow({ nameEn, nameFr: nameEn }), category })

describe('dishListRow', () => {
  it('sends money as the two-decimal string and AR as one flag from either asset', () => {
    expect(dishListRow({ ...dishRow({ price: new Prisma.Decimal('7') }), subcategory: null })).toMatchObject({ price: '7.00', hasAR: false })
    expect(dishListRow({ ...dishRow({ usdzUrl: '/a.usdz' }), subcategory: null }).hasAR).toBe(true)
    expect(dishListRow({ ...dishRow({ glbUrl: '/a.glb' }), subcategory: null }).hasAR).toBe(true)
  })

  it('labels the category alone when its subcategory repeats the name, both otherwise, none without one', () => {
    expect(dishListRow({ ...dishRow(), subcategory: sub('mains') }).category).toBe('Mains')
    expect(dishListRow({ ...dishRow(), subcategory: sub('Grill') }).category).toBe('Mains · Grill')
    expect(dishListRow({ ...dishRow(), subcategory: null }).category).toBeNull()
  })

  it('carries the identity, names, image, flags and creation date through unchanged', () => {
    const row = dishRow({ id: 'd7', nameEn: 'Harira', nameFr: 'Harira', imageUrl: '/h.jpg', isActive: false, isMostPurchased: true })
    expect(dishListRow({ ...row, subcategory: null })).toMatchObject({
      id: 'd7',
      nameEn: 'Harira',
      nameFr: 'Harira',
      imageUrl: '/h.jpg',
      isActive: false,
      isMostPurchased: true,
      createdAt: row.createdAt,
    })
  })
})
