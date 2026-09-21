import { describe, expect, it, vi } from 'vitest'
import { dishRow, restaurantRow } from '@/test/factories/prisma'

// vi.mock is hoisted above these, so the stand-ins come from vi.hoisted.
const { findUnique, findMany } = vi.hoisted(() => ({ findUnique: vi.fn(), findMany: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ default: { restaurant: { findUnique }, dish: { findMany } } }))

import { loadMenu } from './menu-loader'

describe('loadMenu', () => {
  it('answers null for an unknown slug without looking for dishes', async () => {
    findUnique.mockResolvedValueOnce(null)
    findMany.mockClear()
    expect(await loadMenu('nobody')).toBeNull()
    expect(findMany).not.toHaveBeenCalled()
  })

  it('reads the live menu tree in display order, then the live dishes outside any category', async () => {
    const restaurant = { ...restaurantRow({ id: 'r1' }), categories: [] }
    const loose = [dishRow({ id: 'd9' })]
    findUnique.mockResolvedValueOnce(restaurant)
    findMany.mockResolvedValueOnce(loose)

    expect(await loadMenu('chez-test')).toEqual({ restaurant, uncategorizedDishes: loose })

    const live = { where: { isActive: true }, include: { ingredients: true }, orderBy: { sortOrder: 'asc' } }
    expect(findUnique).toHaveBeenLastCalledWith({
      where: { slug: 'chez-test' },
      include: {
        categories: {
          include: { subcategories: { include: { dishes: live }, orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
    expect(findMany).toHaveBeenLastCalledWith({
      where: { restaurantId: 'r1', subcategoryId: null, isActive: true },
      include: { ingredients: true },
      orderBy: { sortOrder: 'asc' },
    })
  })
})
