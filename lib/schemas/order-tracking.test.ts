import { describe, expect, it } from 'vitest'
import { guestOrderEntry, guestOrderToken, storedGuestOrders, trackSegment, trackedOrder } from './order-tracking'

const token = 'Ab3_-'.repeat(6) + 'zz'
const tracked = {
  number: 12,
  table: '4',
  status: 'READY',
  lines: [{ nameEn: 'Tea', nameFr: 'Thé', quantity: 2 }],
  subtotal: '22.40',
  currency: null,
  createdAt: '2026-09-29T19:00:00.000Z',
  acceptedAt: null,
  readyAt: '2026-09-29T19:15:00.000Z',
  servedAt: null,
  restaurant: { slug: 'dar-zitoun', name: 'Dar Zitoun' },
}

describe('guestOrderToken', () => {
  it('takes 32 URL-safe characters and nothing else', () => {
    expect(guestOrderToken.safeParse(token).success).toBe(true)
    for (const bad of ['', token.slice(1), `${token}a`, `${token.slice(1)}=`, `${token.slice(1)}/`, '11111111-1111-4111-8111-111111111111']) {
      expect(guestOrderToken.safeParse(bad).success, bad).toBe(false)
    }
  })

  it('is the route segment', () => {
    expect(trackSegment.safeParse({ token }).success).toBe(true)
    expect(trackSegment.safeParse({ token: 'x' }).success).toBe(false)
  })
})

describe('trackedOrder', () => {
  it('reads what the route answers', () => {
    expect(trackedOrder.parse(tracked)).toEqual(tracked)
  })

  it('refuses an unknown status or a line with nothing coming', () => {
    expect(trackedOrder.safeParse({ ...tracked, status: 'LOST' }).success).toBe(false)
    expect(trackedOrder.safeParse({ ...tracked, lines: [{ nameEn: 'Tea', nameFr: 'Thé', quantity: 0 }] }).success).toBe(false)
  })
})

describe('storedGuestOrders', () => {
  const entry = { token, number: 12, table: '4', placedAt: '2026-09-29T19:00:00.000Z', status: 'NEW', finishedAt: null }

  it('reads a remembered list', () => {
    expect(guestOrderEntry.safeParse(entry).success).toBe(true)
    expect(storedGuestOrders.parse([entry])).toEqual([entry])
  })

  it('reads anything else as no orders', () => {
    expect(storedGuestOrders.parse('nope')).toEqual([])
    expect(storedGuestOrders.parse([{ ...entry, placedAt: 'yesterday' }])).toEqual([])
    expect(storedGuestOrders.parse(Array.from({ length: 21 }, () => entry))).toEqual([])
  })
})
