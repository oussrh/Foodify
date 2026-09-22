import { describe, expect, it } from 'vitest'
import { makeCategory, makeDish, makeSubcategory } from '@/test/factories/menu'
import { cartLineViews, cartLinesToSend, cartSubtotal, dishesById } from './cart-lines'

const chicken = makeDish({ id: 'd1', nameEn: 'Chicken', price: '12.50' })
const salad = makeDish({ id: 'd2', nameEn: 'Salad', price: '4.25' })
const special = makeDish({ id: 'd3', nameEn: 'Special', price: '9.00' })
const categories = [makeCategory({ subcategories: [makeSubcategory({ dishes: [chicken, salad] })] })]

describe('dishesById', () => {
  it('holds the categories\' dishes and the uncategorized ones alike', () => {
    const map = dishesById(categories, [special])
    expect([...map.keys()].sort()).toEqual(['d1', 'd2', 'd3'])
  })
})

describe('cartLineViews', () => {
  it('joins each line to its dish, in the order they were added', () => {
    const cart = { lines: [{ dishId: 'd2', quantity: 1 }, { dishId: 'd1', quantity: 2 }], table: '4' }
    const views = cartLineViews(cart, dishesById(categories, []))
    expect(views.map((v) => [v.dish.id, v.quantity])).toEqual([['d2', 1], ['d1', 2]])
  })

  it('leaves out a line whose dish the menu no longer has', () => {
    const cart = { lines: [{ dishId: 'd1', quantity: 1 }, { dishId: 'gone', quantity: 3 }], table: '' }
    expect(cartLineViews(cart, dishesById(categories, [])).map((v) => v.dish.id)).toEqual(['d1'])
  })

  it('carries what was asked for on a dish, and an empty note for one with none', () => {
    const cart = { lines: [{ dishId: 'd1', quantity: 1, note: 'No onions' }, { dishId: 'd2', quantity: 1 }], table: '' }
    expect(cartLineViews(cart, dishesById(categories, [])).map((v) => v.note)).toEqual(['No onions', ''])
  })
})

describe('cartLinesToSend', () => {
  it('sends ids and counts, with the note trimmed and only where there is one', () => {
    const views = [
      { dish: chicken, quantity: 2, note: 'No onions ' },
      { dish: salad, quantity: 1, note: '  ' },
    ]
    expect(cartLinesToSend(views)).toEqual([
      { dishId: 'd1', quantity: 2, note: 'No onions' },
      { dishId: 'd2', quantity: 1 },
    ])
  })
})

describe('cartSubtotal', () => {
  it('is 0.00 for no lines and the exact total otherwise', () => {
    expect(cartSubtotal([])).toBe('0.00')
    expect(cartSubtotal([{ dish: chicken, quantity: 2, note: '' }, { dish: salad, quantity: 3, note: 'Extra dressing' }])).toBe('37.75')
  })
})
