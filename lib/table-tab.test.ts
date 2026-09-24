import { describe, expect, it } from 'vitest'
import { serviceDayStart } from './availability'
import { ADD_BY_DEFAULT_MINUTES, additionLabel, addToRefusal, billCancelled, currentTab, defaultsToAdd, tabTotal, type TabFacts } from './table-tab'

// One bill per table visit: the rule that says which order is a table's open bill, and whether a
// send adds to it by default, stated with literal values rather than read back from the module,
// so a change to the rule has to change these too.

const ZONE = 'Africa/Casablanca' // UTC+1 all year
const NOW = new Date('2026-09-24T20:00:00Z') // 21:00 local
const AT = { restaurantId: 'r1', table: '4', serviceStart: serviceDayStart(NOW, ZONE) }

const order = (over: Partial<TabFacts> & { id?: string } = {}) => ({
  id: 'o1',
  restaurantId: 'r1',
  table: '4',
  parentId: null,
  cancelled: false,
  createdAt: '2026-09-24T19:00:00Z',
  closedAt: null,
  ...over,
})

describe('addToRefusal', () => {
  it('takes an order that opened this table this service, whatever the kitchen has done with it', () => {
    expect(addToRefusal(order(), AT)).toBeNull()
  })

  it('reads a missing order and another restaurant’s alike, so a guess learns nothing', () => {
    expect(addToRefusal(null, AT)).toBe('not_found')
    expect(addToRefusal(order({ restaurantId: 'r2' }), AT)).toBe('not_found')
  })

  it('refuses another table, an addition and a cancelled order', () => {
    expect(addToRefusal(order({ table: '5' }), AT)).toBe('other_table')
    expect(addToRefusal(order({ parentId: 'o0' }), AT)).toBe('not_a_parent')
    expect(addToRefusal(order({ cancelled: true }), AT)).toBe('cancelled')
  })

  it('refuses a bill somebody closed, whatever its tickets are doing', () => {
    expect(addToRefusal(order({ closedAt: '2026-09-24T19:40:00Z' }), AT)).toBe('closed')
    expect(addToRefusal(order({ closedAt: new Date('2026-09-24T19:40:00Z') }), AT)).toBe('closed')
  })

  it('refuses a bill of an earlier service, and takes one opened at 04:00 local itself', () => {
    // The day began at 03:00 UTC (04:00 in Casablanca).
    expect(AT.serviceStart.toISOString()).toBe('2026-09-24T03:00:00.000Z')
    expect(addToRefusal(order({ createdAt: '2026-09-24T02:59:59Z' }), AT)).toBe('previous_service')
    expect(addToRefusal(order({ createdAt: new Date('2026-09-24T03:00:00Z') }), AT)).toBeNull()
  })
})

describe('billCancelled', () => {
  it('is true only when every ticket of the bill is cancelled', () => {
    expect(billCancelled([{ status: 'CANCELLED' }, { status: 'CANCELLED' }])).toBe(true)
    expect(billCancelled([{ status: 'CANCELLED' }, { status: 'ACCEPTED' }])).toBe(false)
    expect(billCancelled([{ status: 'DONE' }])).toBe(false)
  })

  it('keeps a bill whose opening ticket was cancelled while an addition is live', () => {
    const tickets = [{ status: 'CANCELLED' as const }, { status: 'NEW' as const }]
    expect(addToRefusal(order({ cancelled: billCancelled(tickets) }), AT)).toBeNull()
  })

  it('is false for no tickets at all', () => {
    expect(billCancelled([])).toBe(false)
  })
})

describe('currentTab', () => {
  it('is the most recent order that may still be added to', () => {
    const first = order({ id: 'a', createdAt: '2026-09-24T12:00:00Z' })
    const second = order({ id: 'b', createdAt: '2026-09-24T19:30:00Z' })
    expect(currentTab([second, first], AT)?.id).toBe('b')
    expect(currentTab([first, second], AT)?.id).toBe('b')
  })

  it('skips a later order that is cancelled or is an addition, and falls back to the bill still open', () => {
    const open = order({ id: 'open', createdAt: '2026-09-24T18:00:00Z' })
    const cancelled = order({ id: 'x', cancelled: true, createdAt: '2026-09-24T19:00:00Z' })
    const addition = order({ id: 'y', parentId: 'open', createdAt: '2026-09-24T19:30:00Z' })
    expect(currentTab([open, cancelled, addition], AT)?.id).toBe('open')
  })

  it('never picks a closed bill again: the table falls back to an older open one, or to none', () => {
    const older = order({ id: 'older', createdAt: '2026-09-24T12:00:00Z' })
    const closed = order({ id: 'closed', createdAt: '2026-09-24T19:30:00Z', closedAt: '2026-09-24T19:50:00Z' })
    expect(currentTab([older, closed], AT)?.id).toBe('older')
    expect(currentTab([closed], AT)).toBeNull()
  })

  it('is null for a table with nothing open: nothing sent, or another table', () => {
    expect(currentTab([], AT)).toBeNull()
    expect(currentTab([order({ table: '7' })], AT)).toBeNull()
  })

  it('leaves last night’s 23:30 bill behind once 04:00 has passed', () => {
    const lastNight = order({ createdAt: '2026-09-23T22:30:00Z' }) // 23:30 local
    const lateThatNight = { ...AT, serviceStart: serviceDayStart(new Date('2026-09-24T01:00:00Z'), ZONE) } // 02:00 local
    expect(currentTab([lastNight], lateThatNight)).not.toBeNull()
    const nextMorning = { ...AT, serviceStart: serviceDayStart(new Date('2026-09-24T10:00:00Z'), ZONE) } // 11:00 local
    expect(currentTab([lastNight], nextMorning)).toBeNull()
  })
})

describe('defaultsToAdd', () => {
  const served = (servedAt: string) => ({ status: 'DONE' as const, servedAt })

  it('adds while any ticket of the bill is still with the kitchen or on the pass', () => {
    expect(defaultsToAdd({ parent: { status: 'ACCEPTED', servedAt: null }, additions: [] }, NOW)).toBe(true)
    expect(defaultsToAdd({ parent: served('2026-09-24T12:30:00Z'), additions: [{ status: 'READY', servedAt: null }] }, NOW)).toBe(true)
  })

  it('adds dessert ordered half an hour after the mains went out', () => {
    expect(defaultsToAdd({ parent: served('2026-09-24T19:30:00Z'), additions: [] }, NOW)).toBe(true)
  })

  it('starts a new bill for a table re-seated at 19:00 after a lunch served at 13:30', () => {
    const lunch = { parent: served('2026-09-24T12:30:00Z'), additions: [] } // 13:30 local
    expect(defaultsToAdd(lunch, new Date('2026-09-24T18:00:00Z'))).toBe(false) // 19:00 local
  })

  it('reads the latest plate of the bill, up to ninety minutes and not past it', () => {
    expect(ADD_BY_DEFAULT_MINUTES).toBe(90)
    const tab = { parent: served('2026-09-24T17:00:00Z'), additions: [served('2026-09-24T18:30:00Z'), { status: 'CANCELLED' as const, servedAt: null }] }
    expect(defaultsToAdd(tab, NOW)).toBe(true) // exactly 90 minutes after 18:30 UTC
    expect(defaultsToAdd(tab, new Date('2026-09-24T20:00:01Z'))).toBe(false)
  })

  it('starts a new bill when nothing of it went out and nothing is open', () => {
    expect(defaultsToAdd({ parent: { status: 'DONE', servedAt: null }, additions: [] }, NOW)).toBe(false)
  })
})

describe('tabTotal', () => {
  it('sums every ticket exactly, leaving a cancelled one out', () => {
    // 0.10 + 0.20 is 0.30000000000000004 as floats; on minor units it is 0.30.
    expect(tabTotal([{ status: 'DONE', subtotal: '0.10' }, { status: 'NEW', subtotal: '0.20' }])).toBe('0.30')
    expect(tabTotal([{ status: 'DONE', subtotal: '28.50' }, { status: 'CANCELLED', subtotal: '9.50' }, { status: 'READY', subtotal: '7.00' }])).toBe('35.50')
  })

  it('is zero for no tickets', () => {
    expect(tabTotal([])).toBe('0.00')
  })
})

describe('additionLabel', () => {
  it('names the order an addition belongs to, and nothing on one that opened the bill', () => {
    expect(additionLabel({ parentNumber: 12 })).toBe('Addition to #12')
    expect(additionLabel({ parentNumber: null })).toBeNull()
  })
})
