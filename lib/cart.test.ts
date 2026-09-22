import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EMPTY_CART,
  MAX_LINES,
  MAX_NOTE,
  MAX_QUANTITY,
  cartCount,
  cartStorageKey,
  noteOf,
  parseCart,
  quantityOf,
  readCart,
  withNote,
  withQuantity,
  writeCart,
  type Cart,
} from './cart'

const cart = (overrides: Partial<Cart> = {}): Cart => ({ lines: [{ dishId: 'd1', quantity: 2 }], table: '7', ...overrides })

describe('withQuantity', () => {
  it('adds a dish that is not in the cart', () => {
    expect(withQuantity(EMPTY_CART, 'd1', 1).lines).toEqual([{ dishId: 'd1', quantity: 1 }])
  })

  it('changes the quantity of one already in it, leaving the others alone', () => {
    const two = { lines: [{ dishId: 'd1', quantity: 1 }, { dishId: 'd2', quantity: 4 }], table: '' }
    expect(withQuantity(two, 'd1', 3).lines).toEqual([{ dishId: 'd1', quantity: 3 }, { dishId: 'd2', quantity: 4 }])
  })

  it('removes the line at zero or below, and is the same cart when there was none', () => {
    expect(withQuantity(cart(), 'd1', 0).lines).toEqual([])
    expect(withQuantity(cart(), 'd1', -5).lines).toEqual([])
    const untouched = cart()
    expect(withQuantity(untouched, 'nothing', 0)).toBe(untouched)
  })

  it('clamps to the ceiling and truncates a fraction', () => {
    expect(quantityOf(withQuantity(EMPTY_CART, 'd1', MAX_QUANTITY + 10), 'd1')).toBe(MAX_QUANTITY)
    expect(quantityOf(withQuantity(EMPTY_CART, 'd1', 2.9), 'd1')).toBe(2)
  })

  it('refuses a new dish once the cart holds MAX_LINES of them, but still changes the ones in it', () => {
    const full = { lines: Array.from({ length: MAX_LINES }, (_, i) => ({ dishId: `d${i}`, quantity: 1 })), table: '' }
    expect(withQuantity(full, 'one-more', 1)).toBe(full)
    expect(quantityOf(withQuantity(full, 'd0', 5), 'd0')).toBe(5)
  })
})

describe('withNote', () => {
  it('sets what the guest asked for on a dish that is in the cart', () => {
    expect(noteOf(withNote(cart(), 'd1', 'No onions'), 'd1')).toBe('No onions')
  })

  // A note is stored as it is typed: trimming here would eat the space the moment it is typed,
  // so the next letter lands against the last word ("No onions" typed as "Noonions").
  it('keeps a space the guest has just typed', () => {
    expect(noteOf(withNote(cart(), 'd1', 'No '), 'd1')).toBe('No ')
  })

  it('drops a note that is blank rather than storing it empty', () => {
    const noted = withNote(cart(), 'd1', 'No onions')
    expect(withNote(noted, 'd1', '   ').lines[0]).toEqual({ dishId: 'd1', quantity: 2 })
  })

  it('drops one that is nothing but spaces', () => {
    expect(withNote(cart(), 'd1', '   ').lines[0]).toEqual({ dishId: 'd1', quantity: 2 })
  })

  it('cuts a note at the ceiling', () => {
    expect(noteOf(withNote(cart(), 'd1', 'x'.repeat(MAX_NOTE + 50)), 'd1')).toHaveLength(MAX_NOTE)
  })

  it('never adds a dish: a note for one that is not in the cart is the same cart', () => {
    const untouched = cart()
    expect(withNote(untouched, 'nothing', 'No onions')).toBe(untouched)
    expect(noteOf(untouched, 'nothing')).toBe('')
  })

  it('is kept when the quantity changes and gone when the dish is removed', () => {
    const noted = withNote(cart(), 'd1', 'No onions')
    expect(noteOf(withQuantity(noted, 'd1', 5), 'd1')).toBe('No onions')
    expect(noteOf(withQuantity(withQuantity(noted, 'd1', 0), 'd1', 1), 'd1')).toBe('')
  })
})

describe('cartCount', () => {
  it('sums the quantities, not the lines', () => {
    expect(cartCount(EMPTY_CART)).toBe(0)
    expect(cartCount({ lines: [{ dishId: 'a', quantity: 2 }, { dishId: 'b', quantity: 3 }], table: '' })).toBe(5)
  })
})

describe('parseCart', () => {
  it('reads what writeCart stored', () => {
    expect(parseCart(JSON.stringify(cart()))).toEqual(cart())
  })

  it('is the empty cart for nothing, for a non-JSON string and for a shape that is not a cart', () => {
    for (const raw of [null, '', 'not json', '[]', '{"lines":"x"}', '42']) {
      expect(parseCart(raw)).toEqual(EMPTY_CART)
    }
  })

  it('keeps only usable lines and bounds them', () => {
    const raw = JSON.stringify({ lines: [{ dishId: 'd1', quantity: 999 }, { dishId: 7, quantity: 1 }, { dishId: 'd2', quantity: 1.5 }, { dishId: 'd3', quantity: 0 }], table: 5 })
    expect(parseCart(raw)).toEqual({ lines: [{ dishId: 'd1', quantity: MAX_QUANTITY }, { dishId: 'd3', quantity: 1 }], table: '' })
  })

  it('reads a stored note, trims it, cuts it at the ceiling and drops one that is not text', () => {
    const raw = JSON.stringify({
      lines: [
        { dishId: 'd1', quantity: 1, note: '  No onions  ' },
        { dishId: 'd2', quantity: 1, note: 'x'.repeat(MAX_NOTE + 10) },
        { dishId: 'd3', quantity: 1, note: 42 },
      ],
      table: '',
    })
    const parsed = parseCart(raw)
    expect(parsed.lines[0]).toEqual({ dishId: 'd1', quantity: 1, note: 'No onions' })
    expect(parsed.lines[1]?.note).toHaveLength(MAX_NOTE)
    expect(parsed.lines[2]).toEqual({ dishId: 'd3', quantity: 1 })
  })
})

describe('readCart and writeCart', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('stores the cart under the restaurant\'s own key and reads it back', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('window', { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) } })
    writeCart('r1', cart())
    expect(store.has(cartStorageKey('r1'))).toBe(true)
    expect(readCart('r1')).toEqual(cart())
    expect(readCart('r2')).toEqual(EMPTY_CART)
  })

  it('removes the key for a cart with nothing in it and no table', () => {
    const store = new Map<string, string>([[cartStorageKey('r1'), JSON.stringify(cart())]])
    vi.stubGlobal('window', { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) } })
    writeCart('r1', EMPTY_CART)
    expect(store.has(cartStorageKey('r1'))).toBe(false)
  })

  it('is the empty cart, and no throw, when storage is unavailable', () => {
    const unavailable = () => {
      throw new Error('denied')
    }
    vi.stubGlobal('window', { localStorage: { getItem: unavailable, setItem: unavailable, removeItem: unavailable } })
    expect(readCart('r1')).toEqual(EMPTY_CART)
    expect(() => writeCart('r1', cart())).not.toThrow()
  })
})
