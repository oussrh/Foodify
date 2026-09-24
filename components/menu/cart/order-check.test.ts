import { describe, expect, it } from 'vitest'
import { MENU_TEXT } from '@/lib/menu-text'
import { placedOrder, refusedDish } from '@/lib/schemas/order'
import { checkOrder, type OrderDraft } from './order-check'

const draft: OrderDraft = {
  restaurantId: '5b4c3f0e-6a1d-4c3b-9f7e-2d1a0b9c8e7f',
  table: ' 12 ',
  phone: '06 12 34 56 78',
  lines: [{ dishId: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', quantity: 2 }],
  note: '  ',
}

describe('checkOrder', () => {
  it('sends what the route parses: trimmed, the phone normalised, an empty note left out', () => {
    const checked = checkOrder(draft, 'en', true)
    expect(checked).toEqual({ ok: true, body: expect.objectContaining({ table: '12', phone: '0612345678', locale: 'en' }) })
    expect(checked.ok && checked.body.note).toBeUndefined()
  })

  it('names the table, missing or too long, in the guest language', () => {
    expect(checkOrder({ ...draft, table: ' ' }, 'fr', true)).toEqual({ ok: false, field: 'table', message: MENU_TEXT.fr.tableRequired })
    expect(checkOrder({ ...draft, table: '1'.repeat(21) }, 'en', true)).toEqual({ ok: false, field: 'table', message: MENU_TEXT.en.tableTooLong })
  })

  it('asks a guest for a phone and lets a waiter send without one', () => {
    expect(checkOrder({ ...draft, phone: '' }, 'en', true)).toEqual({ ok: false, field: 'phone', message: MENU_TEXT.en.phoneRequired })
    expect(checkOrder({ ...draft, phone: '' }, 'en', false).ok).toBe(true)
    expect(checkOrder({ ...draft, phone: '12ab' }, 'en', false)).toEqual({ ok: false, field: 'phone', message: MENU_TEXT.en.phoneInvalid })
  })

  it('names a note too long, for the order or for a dish', () => {
    expect(checkOrder({ ...draft, note: 'x'.repeat(301) }, 'en', true)).toMatchObject({ field: 'note', message: MENU_TEXT.en.noteTooLong })
    const lines = [{ dishId: '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', quantity: 1, note: 'x'.repeat(141) }]
    expect(checkOrder({ ...draft, lines }, 'en', true)).toMatchObject({ field: 'lines', message: MENU_TEXT.en.lineNoteTooLong })
  })

  it('reads anything else wrong with the order as refused', () => {
    expect(checkOrder({ ...draft, lines: [] }, 'en', true)).toMatchObject({ field: 'lines', message: MENU_TEXT.en.orderRejected })
    expect(checkOrder({ ...draft, restaurantId: 'x' }, 'en', true)).toMatchObject({ field: 'lines', message: MENU_TEXT.en.orderRejected })
  })
})

describe('order responses', () => {
  it('reads a placed order and a refused dish, and refuses another shape', () => {
    expect(placedOrder.safeParse({ id: 'o', number: 3, table: '12', subtotal: '9.00' }).success).toBe(true)
    expect(placedOrder.safeParse({ id: 'o', number: '3' }).success).toBe(false)
    expect(refusedDish.safeParse({ dishId: 'd', nameEn: null, nameFr: 'Tajine', reason: 'sold_out' }).success).toBe(true)
    expect(refusedDish.safeParse({ nameEn: 'x', nameFr: 'x', reason: 'gone' }).success).toBe(false)
  })
})
