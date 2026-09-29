import { describe, expect, it } from 'vitest'
import { foldName, mappingRows, suggestItem } from './mapping'

const items = [
  { id: 'i-harira', name: 'Harira', price: '4.50' },
  { id: 'i-tea', name: 'Thé à la menthe', price: '3.00' },
  { id: 'i-tagine', name: 'Lamb Tagine with Prunes', price: '16.50' },
  { id: 'i-blank', name: '-', price: '0.00' },
]

describe('foldName', () => {
  it('drops case, accents and punctuation', () => {
    expect(foldName('  Thé à la Menthe! ')).toBe('the a la menthe')
  })
})

describe('suggestItem', () => {
  it('finds the same name, folded', () => {
    expect(suggestItem('HARIRA', items)?.id).toBe('i-harira')
    expect(suggestItem('the a la menthe', items)?.id).toBe('i-tea')
  })

  it('finds one name inside the other', () => {
    expect(suggestItem('Harira (bowl)', items)?.id).toBe('i-harira')
    expect(suggestItem('Lamb Tagine', items)?.id).toBe('i-tagine')
  })

  it('suggests nothing when nothing is close, and never for an empty name', () => {
    expect(suggestItem('Couscous', items)).toBeNull()
    expect(suggestItem('!!', items)).toBeNull()
  })
})

describe('mappingRows', () => {
  it('gives every dish its suggestion and its current match, dropping a match to an item the POS no longer lists', () => {
    const dishes = [
      { id: 'd1', name: 'Harira', price: '4.50' },
      { id: 'd2', name: 'Couscous', price: '12.00' },
    ]
    expect(mappingRows(dishes, items, new Map([['d1', 'i-harira'], ['d2', 'i-gone']]))).toEqual([
      { dishId: 'd1', name: 'Harira', price: '4.50', suggestedItemId: 'i-harira', currentItemId: 'i-harira' },
      { dishId: 'd2', name: 'Couscous', price: '12.00', suggestedItemId: null, currentItemId: null },
    ])
  })
})
