import { describe, expect, it } from 'vitest'
import { dishInput, dishPatch } from './dish'

const dish = { nameEn: 'Grilled Chicken', nameFr: 'Poulet grillé', price: 12.5, imageUrl: '/chicken.jpg' }

describe('dish schemas', () => {
  it('accepts the seed dish and refuses a negative price', () => {
    expect(dishInput.safeParse(dish).success).toBe(true)
    expect(dishInput.safeParse({ ...dish, price: -1 }).error?.issues[0].message).toBe('Price must be a valid number greater than 0')
  })

  it('only stores dietary and allergen keys the menu can label', () => {
    expect(dishInput.safeParse({ ...dish, dietary: ['vegan'], allergens: ['nuts'] }).success).toBe(true)
    expect(dishInput.safeParse({ ...dish, dietary: ['keto'] }).success).toBe(false)
  })

  it('lets a patch carry any subset, plus the active flag', () => {
    expect(dishPatch.safeParse({ isActive: false }).success).toBe(true)
    expect(dishPatch.safeParse({ calories: 1.5 }).success).toBe(false)
  })
})
