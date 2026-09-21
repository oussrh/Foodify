import { describe, expect, it, vi } from 'vitest'
import { dishRow, restaurantRow } from '@/test/factories/prisma'

// vi.mock is hoisted above these, so the stand-ins come from vi.hoisted.
const { findUnique, findUniqueOrThrow, findMany } = vi.hoisted(() => ({ findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findMany: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ default: { restaurant: { findUnique, findUniqueOrThrow }, dish: { findMany } } }))

import { loadMenu } from './menu-loader'

describe('loadMenu', () => {
  it('answers null for an unknown slug without reading the tree or the dishes', async () => {
    findUnique.mockResolvedValueOnce(null)
    findUniqueOrThrow.mockClear()
    findMany.mockClear()
    expect(await loadMenu('nobody')).toBeNull()
    expect(findUniqueOrThrow).not.toHaveBeenCalled()
    expect(findMany).not.toHaveBeenCalled()
  })

  it("reads the live menu tree in display order, the restaurant's own dishes only, then the live dishes outside any category", async () => {
    const restaurant = { ...restaurantRow({ id: 'r1' }), categories: [] }
    const loose = [dishRow({ id: 'd9' })]
    findUnique.mockResolvedValueOnce({ id: 'r1' })
    findUniqueOrThrow.mockResolvedValueOnce(restaurant)
    findMany.mockResolvedValueOnce(loose)

    expect(await loadMenu('chez-test')).toEqual({ restaurant, uncategorizedDishes: loose })

    expect(findUnique).toHaveBeenLastCalledWith({ where: { slug: 'chez-test' }, select: { id: true } })
    const live = { where: { isActive: true, restaurantId: 'r1' }, include: { ingredients: true }, orderBy: { sortOrder: 'asc' } }
    expect(findUniqueOrThrow).toHaveBeenLastCalledWith({
      where: { id: 'r1' },
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
