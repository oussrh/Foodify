import { describe, expect, it } from 'vitest'
import { Prisma } from '@/generated/prisma/client'
import { trackedOrder } from '@/lib/schemas/order-tracking'
import { serializeTrackedOrder, trackedOrderSelect } from './order-tracking'

// The guest's reading of an order is public to whoever holds the link, so what it selects is as
// much the point as what it returns: nothing the kitchen or the floor keeps to themselves.

type Row = Parameters<typeof serializeTrackedOrder>[0]
const row = (over: Partial<Row> = {}): Row =>
  ({
    number: 12,
    table: '4',
    status: 'ACCEPTED',
    subtotal: new Prisma.Decimal('22.40'),
    currency: 'MAD',
    createdAt: new Date('2026-09-29T19:00:00Z'),
    acceptedAt: new Date('2026-09-29T19:03:00Z'),
    readyAt: null,
    servedAt: null,
    closedAt: null,
    parent: null,
    lines: [
      { nameEn: 'Chicken', nameFr: 'Poulet', quantity: 2, removedQuantity: 0 },
      { nameEn: 'Tea', nameFr: 'Thé', quantity: 3, removedQuantity: 1 },
      { nameEn: 'Salad', nameFr: 'Salade', quantity: 1, removedQuantity: 1 },
    ],
    restaurant: { slug: 'dar-zitoun', name: 'Dar Zitoun' },
    ...over,
  }) as Row

describe('trackedOrderSelect', () => {
  it('reads nothing staff-only', () => {
    const keys = Object.keys(trackedOrderSelect)
    for (const secret of ['id', 'phone', 'note', 'placedBy', 'placedById', 'changes', 'externalId', 'posCheckId', 'guestTokenHash', 'parentId', 'closedBy', 'closedById']) {
      expect(keys, secret).not.toContain(secret)
    }
    expect(Object.keys(trackedOrderSelect.lines.select)).not.toContain('note')
    // Of the bill it may be part of, only whether it was closed.
    expect(Object.keys(trackedOrderSelect.parent.select)).toEqual(['closedAt'])
  })
})

describe('serializeTrackedOrder', () => {
  it('lists what is still coming: a portion taken off is not counted, a dish taken off whole is gone', () => {
    expect(serializeTrackedOrder(row()).lines).toEqual([
      { nameEn: 'Chicken', nameFr: 'Poulet', quantity: 2 },
      { nameEn: 'Tea', nameFr: 'Thé', quantity: 2 },
    ])
  })

  it('writes money as an exact decimal and moments as ISO, null where not reached', () => {
    const out = serializeTrackedOrder(row())
    expect(out).toMatchObject({ number: 12, table: '4', status: 'ACCEPTED', subtotal: '22.40', currency: 'MAD', createdAt: '2026-09-29T19:00:00.000Z', acceptedAt: '2026-09-29T19:03:00.000Z', readyAt: null, servedAt: null, restaurant: { slug: 'dar-zitoun', name: 'Dar Zitoun' } })
  })

  it('gives every moment of a served order', () => {
    const out = serializeTrackedOrder(row({ status: 'DONE', readyAt: new Date('2026-09-29T19:15:00Z'), servedAt: new Date('2026-09-29T19:17:00Z') }))
    expect([out.readyAt, out.servedAt]).toEqual(['2026-09-29T19:15:00.000Z', '2026-09-29T19:17:00.000Z'])
  })

  it('reads the bill as closed from the order itself when it opened the bill', () => {
    expect(serializeTrackedOrder(row()).closed).toBe(false)
    expect(serializeTrackedOrder(row({ closedAt: new Date('2026-09-29T20:00:00Z') })).closed).toBe(true)
  })

  it('reads the bill as closed from the order it was merged into, whatever its own stamp says', () => {
    expect(serializeTrackedOrder(row({ parent: { closedAt: new Date('2026-09-29T20:00:00Z') } })).closed).toBe(true)
    expect(serializeTrackedOrder(row({ parent: { closedAt: null }, closedAt: new Date('2026-09-29T20:00:00Z') })).closed).toBe(false)
  })

  it('answers what the client parses', () => {
    expect(trackedOrder.safeParse(serializeTrackedOrder(row())).success).toBe(true)
  })
})
