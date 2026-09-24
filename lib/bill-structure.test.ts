import { describe, expect, it } from 'vitest'
import { serviceDayStart } from './availability'
import { BILL_REFUSED, closeRefusal, landingBill, mergeRefusal, moveRefusal, unmergeRefusal, type BillFacts } from './bill-structure'

// Closing, merging, un-merging and moving a bill, against literal bills: a table's lunch and its
// dinner, another restaurant's, a closed one, a cancelled one, one of last night.

const ZONE = 'Africa/Casablanca' // UTC+1 all year
const NOW = new Date('2026-09-24T20:00:00Z') // 21:00 local
const PLACE = { restaurantId: 'r1', serviceStart: serviceDayStart(NOW, ZONE) }

const bill = (over: Partial<BillFacts> = {}): BillFacts => ({
  id: 'a',
  restaurantId: 'r1',
  table: '4',
  parentId: null,
  cancelled: false,
  createdAt: '2026-09-24T18:00:00Z',
  closedAt: null,
  ...over,
})

describe('mergeRefusal', () => {
  it('takes two open bills of the same table, this service', () => {
    expect(mergeRefusal(bill(), bill({ id: 'b' }), PLACE)).toBeNull()
  })

  it('refuses the same bill twice', () => {
    expect(mergeRefusal(bill(), bill(), PLACE)).toBe('same_bill')
  })

  it('refuses a bill at another table', () => {
    expect(mergeRefusal(bill(), bill({ id: 'b', table: '5' }), PLACE)).toBe('other_table')
  })

  it('refuses a closed bill and a cancelled one, on either side', () => {
    expect(mergeRefusal(bill(), bill({ id: 'b', closedAt: '2026-09-24T19:00:00Z' }), PLACE)).toBe('closed')
    expect(mergeRefusal(bill({ closedAt: '2026-09-24T19:00:00Z' }), bill({ id: 'b' }), PLACE)).toBe('closed')
    expect(mergeRefusal(bill(), bill({ id: 'b', cancelled: true }), PLACE)).toBe('cancelled')
  })

  it('refuses a bill of an earlier service day', () => {
    expect(mergeRefusal(bill(), bill({ id: 'b', createdAt: '2026-09-24T02:00:00Z' }), PLACE)).toBe('previous_service')
  })

  it('reads another restaurant’s bill, and a missing one, as not found', () => {
    expect(mergeRefusal(bill(), bill({ id: 'b', restaurantId: 'r2' }), PLACE)).toBe('not_found')
    expect(mergeRefusal(bill(), null, PLACE)).toBe('not_found')
    expect(mergeRefusal(null, bill(), PLACE)).toBe('not_found')
  })

  it('refuses an addition, which is part of a bill already, on either side', () => {
    expect(mergeRefusal(bill(), bill({ id: 'b', parentId: 'z' }), PLACE)).toBe('not_a_parent')
    expect(mergeRefusal(bill({ parentId: 'z' }), bill({ id: 'b' }), PLACE)).toBe('not_a_parent')
  })
})

describe('moveRefusal', () => {
  it('takes an open bill to another table', () => {
    expect(moveRefusal(bill(), PLACE, '7')).toBeNull()
  })

  it('refuses the table it is already at', () => {
    expect(moveRefusal(bill(), PLACE, '4')).toBe('same_table')
  })

  it('refuses a bill that is closed, cancelled, of another restaurant or of last night', () => {
    expect(moveRefusal(bill({ closedAt: '2026-09-24T19:00:00Z' }), PLACE, '7')).toBe('closed')
    expect(moveRefusal(bill({ cancelled: true }), PLACE, '7')).toBe('cancelled')
    expect(moveRefusal(bill({ restaurantId: 'r2' }), PLACE, '7')).toBe('not_found')
    expect(moveRefusal(bill({ createdAt: '2026-09-23T21:00:00Z' }), PLACE, '7')).toBe('previous_service')
    expect(moveRefusal(null, PLACE, '7')).toBe('not_found')
  })
})

describe('landingBill', () => {
  it('is the target table’s current open bill', () => {
    const lunch = bill({ id: 'l', table: '7', createdAt: '2026-09-24T12:00:00Z' })
    const dinner = bill({ id: 'd', table: '7', createdAt: '2026-09-24T19:00:00Z' })
    expect(landingBill([lunch, dinner], PLACE, '7')?.id).toBe('d')
  })

  it('is null for a table whose bills are all closed or cancelled', () => {
    const closed = bill({ id: 'c', table: '7', closedAt: '2026-09-24T19:30:00Z' })
    const cancelled = bill({ id: 'x', table: '7', cancelled: true })
    expect(landingBill([closed, cancelled], PLACE, '7')).toBeNull()
  })
})

describe('unmergeRefusal', () => {
  const merged = { parentId: 'a', closedAt: null }
  const into = { id: 'a', parentId: null, closedAt: null }
  const record = { changedSince: false }

  it('takes a merge that is on record and still how the bills stand', () => {
    expect(unmergeRefusal(merged, into, record)).toBeNull()
  })

  it('refuses one never merged, or no longer part of that bill', () => {
    expect(unmergeRefusal(merged, into, null)).toBe('not_merged')
    expect(unmergeRefusal({ parentId: null, closedAt: null }, into, record)).toBe('not_merged')
    expect(unmergeRefusal({ parentId: 'z', closedAt: null }, into, record)).toBe('not_merged')
    expect(unmergeRefusal(null, into, record)).toBe('not_merged')
    expect(unmergeRefusal(merged, null, record)).toBe('not_merged')
  })

  it('refuses once the surviving bill has been merged into another or moved since', () => {
    expect(unmergeRefusal(merged, { ...into, parentId: 'c' }, record)).toBe('not_merged')
    expect(unmergeRefusal(merged, into, { changedSince: true })).toBe('not_merged')
  })

  it('refuses once either bill has been closed', () => {
    expect(unmergeRefusal(merged, { ...into, closedAt: '2026-09-24T19:00:00Z' }, record)).toBe('closed')
    expect(unmergeRefusal({ parentId: 'a', closedAt: new Date() }, into, record)).toBe('closed')
  })
})

describe('closeRefusal', () => {
  it('takes an open bill that is not cancelled as a whole', () => {
    expect(closeRefusal({ parentId: null, cancelled: false, closedAt: null })).toBeNull()
  })

  it('refuses an addition, a cancelled bill, a closed one and a missing one', () => {
    expect(closeRefusal({ parentId: 'a', cancelled: false, closedAt: null })).toBe('not_a_parent')
    expect(closeRefusal({ parentId: null, cancelled: true, closedAt: null })).toBe('cancelled')
    expect(closeRefusal({ parentId: null, cancelled: false, closedAt: '2026-09-24T19:00:00Z' })).toBe('closed')
    expect(closeRefusal(null)).toBe('not_found')
  })
})

describe('BILL_REFUSED', () => {
  it('tells the waiter to merge when the target table is taken', () => {
    expect(BILL_REFUSED.occupied).toBe('That table already has an open order: merge into it instead')
  })
})
