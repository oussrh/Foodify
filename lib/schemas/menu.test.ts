import { describe, expect, it } from 'vitest'
import { categoryPatch, order } from './menu'

describe('menu schemas', () => {
  it('reorders by UUIDs only', () => {
    expect(order.safeParse(['4f0c6b7e-3d2a-4c8e-9b1f-2a3b4c5d6e7f']).success).toBe(true)
    expect(order.safeParse(['1']).success).toBe(false)
  })

  it('patches a category by name or by active flag', () => {
    expect(categoryPatch.safeParse({ nameFr: 'Entrées' }).success).toBe(true)
    expect(categoryPatch.safeParse({ isActive: 'yes' }).success).toBe(false)
  })
})
