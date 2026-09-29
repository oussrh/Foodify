import { describe, expect, it } from 'vitest'
import type { GuestOrderEntry } from '@/lib/schemas/order-tracking'
import { MAX_REMEMBERED, activeOrder, forgetOrder, pruneOrders, rememberOrder, withStatus } from './guest-orders'

const NOW = new Date('2026-09-29T21:00:00.000Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString()
const token = (n: number) => String(n).padStart(32, 'x')
const entry = (n: number, over: Partial<GuestOrderEntry> = {}): GuestOrderEntry => ({ token: token(n), number: n, table: '4', placedAt: hoursAgo(1), status: 'NEW', finishedAt: null, ...over })

describe('rememberOrder', () => {
  const placed = (n: number, table = '4') => ({ token: token(n), number: n, table })

  it('puts the order just placed first, sent and not finished', () => {
    const list = rememberOrder([entry(1)], placed(2), NOW)
    expect(list.map((o) => o.number)).toEqual([2, 1])
    expect(list[0]).toEqual({ token: token(2), number: 2, table: '4', placedAt: NOW.toISOString(), status: 'NEW', finishedAt: null })
  })

  it('replaces an order already remembered rather than listing it twice', () => {
    const list = rememberOrder([entry(1), entry(2)], placed(2, '9'), NOW)
    expect(list.map((o) => [o.number, o.table])).toEqual([[2, '9'], [1, '4']])
  })

  it('keeps five at most, dropping the oldest', () => {
    expect(MAX_REMEMBERED).toBe(5)
    let list: GuestOrderEntry[] = []
    for (let n = 1; n <= 7; n++) list = rememberOrder(list, placed(n), NOW)
    expect(list.map((o) => o.number)).toEqual([7, 6, 5, 4, 3])
  })
})

describe('withStatus', () => {
  it('records a new status, and the moment an order is first seen finished', () => {
    const list = withStatus([entry(1)], token(1), 'DONE', NOW)
    expect(list[0]).toMatchObject({ status: 'DONE', finishedAt: NOW.toISOString() })
    const later = new Date(NOW.getTime() + 60_000)
    expect(withStatus(list, token(1), 'CANCELLED', later)[0]?.finishedAt).toBe(NOW.toISOString())
  })

  it('clears the finished moment if the order is back in the kitchen', () => {
    const done = [entry(1, { status: 'DONE', finishedAt: hoursAgo(0.1) })]
    expect(withStatus(done, token(1), 'READY', NOW)[0]).toMatchObject({ status: 'READY', finishedAt: null })
  })

  it('answers the same list when nothing changed, or the order is not there', () => {
    const list = [entry(1, { status: 'ACCEPTED' })]
    expect(withStatus(list, token(1), 'ACCEPTED', NOW)).toBe(list)
    expect(withStatus(list, token(9), 'DONE', NOW)).toBe(list)
  })
})

describe('forgetOrder', () => {
  it('drops the order, and answers the same list when it was not there', () => {
    const list = [entry(1), entry(2)]
    expect(forgetOrder(list, token(1))).toEqual([entry(2)])
    expect(forgetOrder(list, token(9))).toBe(list)
  })
})

describe('pruneOrders', () => {
  it('keeps what is open, and what finished within three hours', () => {
    const list = [entry(1), entry(2, { status: 'DONE', finishedAt: hoursAgo(2.9) })]
    expect(pruneOrders(list, NOW)).toBe(list)
  })

  it('forgets an order finished more than three hours ago', () => {
    expect(pruneOrders([entry(1), entry(2, { status: 'DONE', finishedAt: hoursAgo(3.1) })], NOW)).toEqual([entry(1)])
  })

  it('forgets an order from an earlier visit, even one never seen finished', () => {
    expect(pruneOrders([entry(1, { placedAt: hoursAgo(13) }), entry(2)], NOW)).toEqual([entry(2)])
  })
})

describe('activeOrder', () => {
  it('is the newest order still to follow', () => {
    expect(activeOrder([entry(3, { status: 'DONE', finishedAt: hoursAgo(0) }), entry(2, { status: 'READY' }), entry(1)])?.number).toBe(2)
  })

  it('is null when every order is served or cancelled, or there are none', () => {
    expect(activeOrder([entry(1, { status: 'CANCELLED', finishedAt: hoursAgo(0) })])).toBeNull()
    expect(activeOrder([])).toBeNull()
  })
})
