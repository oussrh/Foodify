import { describe, expect, it } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { boardOrderSelect, serializeOrder } from './order-data'

// The one reading of an order that both the board's endpoint and the history page depend on. Its
// job is to hand a client component JSON: a Decimal is not JSON and neither is a Date, and money
// that goes through a float loses the cent it was carrying. Both halves are held here — the
// columns that are selected, and what the row becomes.

const row = (over: Partial<Parameters<typeof serializeOrder>[0]> = {}) =>
  ({
    id: 'o1',
    number: 12,
    table: '4',
    phone: '+212600112233',
    note: null,
    status: 'NEW',
    subtotal: new Prisma.Decimal('22.40'),
    createdAt: new Date('2026-09-22T12:00:00Z'),
    updatedAt: new Date('2026-09-22T12:05:00Z'),
    acceptedAt: null,
    servedAt: null,
    placedBy: null,
    lines: [{ id: 'l1', nameEn: 'Chicken', nameFr: 'Poulet', quantity: 2, note: 'No onions' }],
    ...over,
  }) as Parameters<typeof serializeOrder>[0]

describe('boardOrderSelect', () => {
  it('carries the two stamps the waits are measured from', () => {
    // `updatedAt` cannot answer either question: it moves again on any later change.
    expect(boardOrderSelect.acceptedAt).toBe(true)
    expect(boardOrderSelect.servedAt).toBe(true)
  })

  it('reads who took the order without reading anything else about them', () => {
    expect(boardOrderSelect.placedBy).toEqual({ select: { email: true } })
  })

  it('takes each line with what the guest asked for on it', () => {
    expect(boardOrderSelect.lines.select).toMatchObject({ nameEn: true, nameFr: true, quantity: true, note: true })
  })
})

describe('serializeOrder', () => {
  it('turns the money into an exact decimal string, never a number', () => {
    const order = serializeOrder(row())
    expect(order.subtotal).toBe('22.40')
    expect(typeof order.subtotal).toBe('string')
  })

  it('keeps a trailing zero a float would drop', () => {
    expect(serializeOrder(row({ subtotal: new Prisma.Decimal('9.50') })).subtotal).toBe('9.50')
    expect(serializeOrder(row({ subtotal: new Prisma.Decimal('16') })).subtotal).toBe('16.00')
  })

  it('writes every date as an ISO string', () => {
    const order = serializeOrder(row({ acceptedAt: new Date('2026-09-22T12:02:00Z'), servedAt: new Date('2026-09-22T12:20:00Z') }))
    expect(order.createdAt).toBe('2026-09-22T12:00:00.000Z')
    expect(order.updatedAt).toBe('2026-09-22T12:05:00.000Z')
    expect(order.acceptedAt).toBe('2026-09-22T12:02:00.000Z')
    expect(order.servedAt).toBe('2026-09-22T12:20:00.000Z')
  })

  it('reads a stage an order has not reached as null, not as a date', () => {
    const order = serializeOrder(row())
    expect(order.acceptedAt).toBeNull()
    expect(order.servedAt).toBeNull()
  })

  it('leaves the rest of the row as it is', () => {
    expect(serializeOrder(row())).toMatchObject({
      id: 'o1',
      number: 12,
      table: '4',
      status: 'NEW',
      lines: [{ id: 'l1', nameEn: 'Chicken', nameFr: 'Poulet', quantity: 2, note: 'No onions' }],
    })
  })

  it('carries who placed it when a waiter did, and null when the guest did', () => {
    expect(serializeOrder(row({ placedBy: { email: 'waiter1@staff.invalid' } })).placedBy).toEqual({
      email: 'waiter1@staff.invalid',
    })
    expect(serializeOrder(row()).placedBy).toBeNull()
  })

  it('is JSON all the way down, which is what a client component receives', () => {
    const order = serializeOrder(row({ acceptedAt: new Date('2026-09-22T12:02:00Z') }))
    expect(JSON.parse(JSON.stringify(order))).toEqual(order)
  })
})
