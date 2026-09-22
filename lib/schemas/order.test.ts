import { describe, expect, it } from 'vitest'
import { MAX_LINES, MAX_NOTE, MAX_QUANTITY } from '@/lib/cart'
import { orderInput } from './order'

const id = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const valid = { restaurantId: id, table: '12', phone: '+212600112233', lines: [{ dishId: other, quantity: 2 }] }

describe('orderInput', () => {
  it('reads a phone the way people write one, and keeps the country when given', () => {
    expect(orderInput.parse({ ...valid, phone: ' +212 600-11.22.33 ' }).phone).toBe('+212600112233')
    expect(orderInput.parse({ ...valid, phone: '00212 600 112233' }).phone).toBe('+212600112233')
    expect(orderInput.parse({ ...valid, phone: '(06) 00 11 22 33' }).phone).toBe('0600112233')
  })

  it('refuses a phone that is typed but unusable', () => {
    // '' and '   ' are not in this list: nothing typed is nothing given, which is the next test
    // and the handler's business rather than the shape's.
    for (const phone of ['12345', '1'.repeat(16), '06 00 AB 22 33', '+']) {
      expect(orderInput.safeParse({ ...valid, phone }).success, String(phone)).toBe(false)
    }
  })

  // Whether a phone may be left out is not the shape's to say: a guest must give one and a waiter
  // ordering at the table has nobody to text, and only the handler knows which is calling.
  it('lets the phone be absent, for the handler to decide on', () => {
    const withoutPhone = { restaurantId: id, table: valid.table, lines: valid.lines }
    expect(orderInput.safeParse(withoutPhone).success).toBe(true)
    expect(orderInput.parse(withoutPhone).phone).toBeUndefined()
  })

  it('takes a table, an optional note and one to fifty lines', () => {
    expect(orderInput.safeParse(valid).success).toBe(true)
    expect(orderInput.safeParse({ ...valid, note: 'No onions' }).success).toBe(true)
  })

  it('takes the language to write the confirmation in, and only the two the menu has', () => {
    expect(orderInput.parse({ ...valid, locale: 'fr' }).locale).toBe('fr')
    expect(orderInput.parse(valid).locale).toBeUndefined()
    expect(orderInput.safeParse({ ...valid, locale: 'es' }).success).toBe(false)
  })

  it('trims the table and refuses an empty or overlong one', () => {
    expect(orderInput.parse({ ...valid, table: '  12  ' }).table).toBe('12')
    expect(orderInput.safeParse({ ...valid, table: '   ' }).error?.issues[0]?.message).toBe('Table number is required')
    expect(orderInput.safeParse({ ...valid, table: 'x'.repeat(21) }).error?.issues[0]?.message).toBe('Table number is too long')
  })

  it('refuses an order with no lines, with too many, or with a dish listed twice', () => {
    expect(orderInput.safeParse({ ...valid, lines: [] }).error?.issues[0]?.message).toBe('The order is empty')
    const many = Array.from({ length: MAX_LINES + 1 }, () => ({ dishId: other, quantity: 1 }))
    expect(orderInput.safeParse({ ...valid, lines: many }).error?.issues[0]?.message).toBe('Too many dishes in one order')
    const twice = [{ dishId: other, quantity: 1 }, { dishId: other, quantity: 2 }]
    expect(orderInput.safeParse({ ...valid, lines: twice }).error?.issues[0]?.message).toBe('A dish is listed twice')
  })

  it('refuses a quantity outside the cart\'s bounds and one that is not whole', () => {
    for (const quantity of [0, -1, MAX_QUANTITY + 1, 1.5]) {
      expect(orderInput.safeParse({ ...valid, lines: [{ dishId: other, quantity }] }).success).toBe(false)
    }
  })

  it('takes a note on a line, trimmed, and refuses one over the ceiling', () => {
    const noted = { ...valid, lines: [{ dishId: other, quantity: 1, note: '  No onions  ' }] }
    expect(orderInput.parse(noted).lines[0]?.note).toBe('No onions')
    const tooLong = { ...valid, lines: [{ dishId: other, quantity: 1, note: 'x'.repeat(MAX_NOTE + 1) }] }
    expect(orderInput.safeParse(tooLong).error?.issues[0]?.message).toBe('A dish note is too long')
  })

  it('refuses an id that is not a UUID and a note over three hundred characters', () => {
    expect(orderInput.safeParse({ ...valid, restaurantId: 'r1' }).success).toBe(false)
    expect(orderInput.safeParse({ ...valid, lines: [{ dishId: 'd1', quantity: 1 }] }).success).toBe(false)
    expect(orderInput.safeParse({ ...valid, note: 'x'.repeat(301) }).error?.issues[0]?.message).toBe('The note is too long')
  })
})

describe('an empty phone', () => {
  const base = {
    restaurantId: '8f0f3d6a-1d3f-4a1b-9c2e-000000000001',
    table: '4',
    lines: [{ dishId: '8f0f3d6a-1d3f-4a1b-9c2e-000000000002', quantity: 1 }],
  }

  it('is read as no phone, the same as leaving the key out', () => {
    // A waiter has nobody to text, and their form sends '' rather than omitting the field.
    // `.optional()` covers a missing key and not an empty string, which refused every order a
    // waiter placed — and the message blamed the menu.
    const omitted = orderInput.safeParse(base)
    const empty = orderInput.safeParse({ ...base, phone: '' })
    expect(omitted.success).toBe(true)
    expect(empty.success).toBe(true)
    expect(empty.success && empty.data.phone).toBeUndefined()
  })

  it('reads whitespace as nothing too', () => {
    expect(orderInput.safeParse({ ...base, phone: '   ' }).success).toBe(true)
  })

  it('still refuses a phone that is typed but unusable', () => {
    expect(orderInput.safeParse({ ...base, phone: '12' }).success).toBe(false)
    expect(orderInput.safeParse({ ...base, phone: 'not a phone' }).success).toBe(false)
  })
})
