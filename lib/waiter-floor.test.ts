import { describe, expect, it } from 'vitest'
import type { BoardOrder } from '@/lib/orders'
import { floorTiles, newlyReady, readyOrders, READY_WINDOW_MINUTES } from './waiter-floor'

const NOW = new Date('2026-09-22T20:00:00Z')

const order = (over: Partial<BoardOrder> = {}): BoardOrder =>
  ({
    id: 'o1',
    number: 1,
    table: '3',
    phone: '',
    note: null,
    status: 'NEW',
    subtotal: '9.50',
    createdAt: '2026-09-22T19:50:00Z',
    updatedAt: '2026-09-22T19:50:00Z',
    acceptedAt: null,
    servedAt: null,
    placedBy: null,
    lines: [{ id: 'l1', nameEn: 'Chicken', nameFr: 'Poulet', quantity: 2, note: null }],
    ...over,
  }) as BoardOrder

describe('readyOrders', () => {
  it('takes an order the kitchen has just finished', () => {
    const served = order({ status: 'DONE', servedAt: '2026-09-22T19:55:00Z' })
    expect(readyOrders([served], NOW)).toHaveLength(1)
  })

  it('lets one age off rather than piling up all service', () => {
    const old = order({ status: 'DONE', servedAt: '2026-09-22T19:00:00Z' })
    expect(readyOrders([old], NOW)).toEqual([])
  })

  it('keeps one right on the edge of the window', () => {
    const edge = new Date(NOW.getTime() - READY_WINDOW_MINUTES * 60_000).toISOString()
    expect(readyOrders([order({ status: 'DONE', servedAt: edge })], NOW)).toHaveLength(1)
  })

  it('never counts a cancelled order as ready to carry', () => {
    expect(readyOrders([order({ status: 'CANCELLED', servedAt: '2026-09-22T19:55:00Z' })], NOW)).toEqual([])
  })

  it('ignores a finished order with no stamp, rather than guessing when it was', () => {
    expect(readyOrders([order({ status: 'DONE', servedAt: null })], NOW)).toEqual([])
    expect(readyOrders([order({ status: 'DONE', servedAt: 'not a date' })], NOW)).toEqual([])
  })
})

describe('floorTiles', () => {
  it('is free when nothing is on the table', () => {
    expect(floorTiles([1], [], [], NOW)[0]).toMatchObject({ table: '1', state: 'free', items: 0, waitingMinutes: 0 })
  })

  it('is cooking while the kitchen still has it', () => {
    const tile = floorTiles([3], [order({ table: '3' })], [], NOW)[0]
    expect(tile).toMatchObject({ state: 'cooking', items: 2, waitingMinutes: 10 })
  })

  it('says ready even when the same table has something still cooking', () => {
    // A plate going cold on the pass outranks a dish that has not been started.
    const tile = floorTiles(
      [3],
      [order({ id: 'a', table: '3' })],
      [order({ id: 'b', table: '3', status: 'DONE', servedAt: '2026-09-22T19:58:00Z' })],
      NOW,
    )[0]
    expect(tile!.state).toBe('ready')
    expect(tile!.cooking).toHaveLength(1)
    expect(tile!.ready).toHaveLength(1)
  })

  it('counts the items of everything on the table', () => {
    const tile = floorTiles([3], [order({ id: 'a', table: '3' })], [order({ id: 'b', table: '3' })], NOW)[0]
    expect(tile!.items).toBe(4)
  })

  it('keeps one table\'s orders off another\'s tile', () => {
    const tiles = floorTiles([1, 2], [order({ table: '2' })], [], NOW)
    expect(tiles[0]).toMatchObject({ table: '1', state: 'free' })
    expect(tiles[1]).toMatchObject({ table: '2', state: 'cooking' })
  })

  it('reads the longest wait on the table, not the first', () => {
    const tile = floorTiles(
      [3],
      [order({ id: 'a', table: '3', createdAt: '2026-09-22T19:55:00Z' }), order({ id: 'b', table: '3', createdAt: '2026-09-22T19:40:00Z' })],
      [],
      NOW,
    )[0]
    expect(tile!.waitingMinutes).toBe(20)
  })

  it('never reads a wait backwards when a clock is off', () => {
    const tile = floorTiles([3], [order({ table: '3', createdAt: '2026-09-22T20:05:00Z' })], [], NOW)[0]
    expect(tile!.waitingMinutes).toBe(0)
  })

  it('keeps the room in the order it was given', () => {
    expect(floorTiles([2, 1, 3], [], [], NOW).map((t) => t.table)).toEqual(['2', '1', '3'])
  })
})

describe('newlyReady', () => {
  it('is what the phone buzzes about: the ones not seen before', () => {
    const ready = [order({ id: 'a' }), order({ id: 'b' })]
    expect(newlyReady(ready, new Set(['a']))).toEqual(['b'])
  })

  it('says nothing when the same orders are still sitting there', () => {
    const ready = [order({ id: 'a' })]
    expect(newlyReady(ready, new Set(['a']))).toEqual([])
  })
})
