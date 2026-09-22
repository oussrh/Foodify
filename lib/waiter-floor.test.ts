import { describe, expect, it } from 'vitest'
import type { BoardOrder } from '@/lib/orders'
import { floorTiles, newlyReady, readyOrders } from './waiter-floor'

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
    readyAt: null,
    servedAt: null,
    placedBy: null,
    lines: [{ id: 'l1', nameEn: 'Chicken', nameFr: 'Poulet', quantity: 2, note: null }],
    ...over,
  }) as BoardOrder

describe('readyOrders', () => {
  it('takes an order the kitchen has called up', () => {
    expect(readyOrders([order({ status: 'READY', readyAt: '2026-09-22T19:55:00Z' })])).toHaveLength(1)
  })

  it('leaves one that is still being made', () => {
    expect(readyOrders([order({ status: 'ACCEPTED' })])).toEqual([])
    expect(readyOrders([order({ status: 'NEW' })])).toEqual([])
  })

  it('drops one the moment a waiter carries it, rather than after a window', () => {
    // The old reading kept a served order on the floor for half an hour and guessed. `READY`
    // ends when somebody ends it.
    expect(readyOrders([order({ status: 'DONE', servedAt: '2026-09-22T19:58:00Z' })])).toEqual([])
  })

  it('never counts a cancelled order as ready to carry', () => {
    expect(readyOrders([order({ status: 'CANCELLED' })])).toEqual([])
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
      [order({ id: 'b', table: '3', status: 'READY', readyAt: '2026-09-22T19:58:00Z' })],
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

  it('names the stage the table is at, so a waiter knows if the kitchen has started', () => {
    expect(floorTiles([3], [order({ table: '3', status: 'NEW' })], [], NOW)[0]!.stage).toBe('NEW')
    expect(floorTiles([3], [order({ table: '3', status: 'ACCEPTED' })], [], NOW)[0]!.stage).toBe('ACCEPTED')
    expect(floorTiles([3], [], [order({ table: '3', status: 'READY' })], NOW)[0]!.stage).toBe('READY')
    expect(floorTiles([3], [], [], NOW)[0]!.stage).toBeNull()
  })

  it('reads the least advanced order, not the furthest along', () => {
    // One dish plated and one not started is still waiting on the kitchen. A tile saying "Ready"
    // would send a waiter over for half an order.
    const tile = floorTiles(
      [3],
      [order({ id: 'a', table: '3', status: 'NEW' })],
      [order({ id: 'b', table: '3', status: 'READY' })],
      NOW,
    )[0]
    expect(tile!.stage).toBe('NEW')
    // The tile is still lit as ready, because there is something to carry now.
    expect(tile!.state).toBe('ready')
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
