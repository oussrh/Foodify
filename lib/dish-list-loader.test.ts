import { describe, expect, it } from 'vitest'
import { dishListArgs } from './dish-list-loader'

describe('dishListArgs', () => {
  it("reads one restaurant's dishes with their category tree, in menu order then newest first", () => {
    expect(dishListArgs('r1', '')).toEqual({
      where: { restaurantId: 'r1' },
      include: { subcategory: { include: { category: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
  })

  it("narrows to a search in either language's name or description, in any case", () => {
    const text = { contains: 'tagine', mode: 'insensitive' }
    expect(dishListArgs('r1', 'tagine').where).toEqual({
      restaurantId: 'r1',
      OR: [{ nameEn: text }, { nameFr: text }, { descriptionEn: text }, { descriptionFr: text }],
    })
  })
})
