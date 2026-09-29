import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GuestOrderEntry } from '@/lib/schemas/order-tracking'
import { guestOrdersKey, parseGuestOrders, readGuestOrders, writeGuestOrders } from './guest-orders-storage'

const entry: GuestOrderEntry = { token: 'a'.repeat(32), number: 12, table: '4', placedAt: '2026-09-29T19:00:00.000Z', status: 'NEW', finishedAt: null }

function memoryStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('window', { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) } })
  return store
}

afterEach(() => vi.unstubAllGlobals())

describe('parseGuestOrders', () => {
  it('reads a stored list back', () => {
    expect(parseGuestOrders(JSON.stringify([entry]))).toEqual([entry])
  })

  it('reads nothing, not JSON, or a list of another shape as no orders', () => {
    expect(parseGuestOrders(null)).toEqual([])
    expect(parseGuestOrders('{nope')).toEqual([])
    expect(parseGuestOrders(JSON.stringify([{ ...entry, token: 'short' }]))).toEqual([])
    expect(parseGuestOrders(JSON.stringify({ orders: [entry] }))).toEqual([])
  })
})

describe('readGuestOrders and writeGuestOrders', () => {
  it('keep one list per restaurant, under its own key', () => {
    const store = memoryStorage()
    writeGuestOrders('r1', [entry])
    expect(store.has(guestOrdersKey('r1'))).toBe(true)
    expect(guestOrdersKey('r1')).toBe('foodify-orders:r1')
    expect(readGuestOrders('r1')).toEqual([entry])
    expect(readGuestOrders('r2')).toEqual([])
  })

  it('remove the key when the list is empty', () => {
    const store = memoryStorage()
    writeGuestOrders('r1', [entry])
    writeGuestOrders('r1', [])
    expect(store.size).toBe(0)
  })

  it('never throw when storage is unavailable', () => {
    const unavailable = () => {
      throw new Error('SecurityError')
    }
    vi.stubGlobal('window', { localStorage: { getItem: unavailable, setItem: unavailable, removeItem: unavailable } })
    expect(readGuestOrders('r1')).toEqual([])
    expect(() => writeGuestOrders('r1', [entry])).not.toThrow()
  })
})
