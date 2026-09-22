import { afterEach, describe, expect, it, vi } from 'vitest'
import { byStatus, CLOSED_STATUSES, isClosed, itemCount, minutesWaiting, nextStatus, OPEN_STATUSES, ORDER_STATUSES, orderTimings, STATUS_LABEL, viewStatuses, WAIT_LATE_MIN, WAIT_WARNING_MIN, waitingTier } from './orders'

describe('nextStatus', () => {
  it('takes a new order on, and only a new one', () => {
    expect(nextStatus('NEW', 'accept')).toBe('ACCEPTED')
    expect(nextStatus('ACCEPTED', 'accept')).toBeNull()
    expect(nextStatus('READY', 'accept')).toBeNull()
    expect(nextStatus('DONE', 'accept')).toBeNull()
    expect(nextStatus('CANCELLED', 'accept')).toBeNull()
  })

  it('calls up an order the kitchen is working, and only one it is working', () => {
    expect(nextStatus('NEW', 'ready')).toBe('READY')
    expect(nextStatus('ACCEPTED', 'ready')).toBe('READY')
    // Pressing Ready twice moves nothing, which is what makes two tablets safe.
    expect(nextStatus('READY', 'ready')).toBeNull()
    expect(nextStatus('DONE', 'ready')).toBeNull()
    expect(nextStatus('CANCELLED', 'ready')).toBeNull()
  })

  it('carries out anything not already finished, including one never called up', () => {
    // A kitchen that plates and hands over in one motion must not have to press twice.
    expect(nextStatus('NEW', 'done')).toBe('DONE')
    expect(nextStatus('ACCEPTED', 'done')).toBe('DONE')
    expect(nextStatus('READY', 'done')).toBe('DONE')
    expect(nextStatus('DONE', 'done')).toBeNull()
    expect(nextStatus('CANCELLED', 'done')).toBeNull()
  })

  it('cancels anything that has not been served', () => {
    expect(nextStatus('NEW', 'cancel')).toBe('CANCELLED')
    expect(nextStatus('ACCEPTED', 'cancel')).toBe('CANCELLED')
    expect(nextStatus('READY', 'cancel')).toBe('CANCELLED')
    expect(nextStatus('CANCELLED', 'cancel')).toBe('CANCELLED')
    // A served order is history: the board cannot take it back.
    expect(nextStatus('DONE', 'cancel')).toBeNull()
  })
})

describe('the board\'s vocabulary', () => {
  it('names every status, and the open ones are the three service works through', () => {
    for (const status of ORDER_STATUSES) expect(STATUS_LABEL[status]).toBeTruthy()
    // READY is open, not closed: the kitchen has finished but the order has not left, and an
    // order nobody has carried is exactly the one a board must keep showing.
    expect([...OPEN_STATUSES]).toEqual(['NEW', 'ACCEPTED', 'READY'])
  })
})

describe('minutesWaiting', () => {
  afterEach(() => vi.useRealTimers())

  it('counts whole minutes since the order was placed', () => {
    const placed = '2026-09-22T12:00:00.000Z'
    const now = new Date('2026-09-22T12:04:30.000Z').getTime()
    expect(minutesWaiting(placed, now)).toBe(4)
  })

  it('is never negative, whatever the clocks say', () => {
    const placed = '2026-09-22T12:05:00.000Z'
    expect(minutesWaiting(placed, new Date('2026-09-22T12:00:00.000Z').getTime())).toBe(0)
  })

  it('reads the clock when it is not given one', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-22T12:10:00.000Z'))
    expect(minutesWaiting('2026-09-22T12:00:00.000Z')).toBe(10)
  })
})

describe('waitingTier', () => {
  it('is fresh until the warning, warning until late, late after', () => {
    expect(waitingTier(0)).toBe('fresh')
    expect(waitingTier(WAIT_WARNING_MIN - 1)).toBe('fresh')
    expect(waitingTier(WAIT_WARNING_MIN)).toBe('warning')
    expect(waitingTier(WAIT_LATE_MIN - 1)).toBe('warning')
    expect(waitingTier(WAIT_LATE_MIN)).toBe('late')
    expect(waitingTier(90)).toBe('late')
  })
})

describe('byStatus', () => {
  it('splits the board into what is waiting and what is being made, keeping the order it was given', () => {
    const orders = [
      { id: 'a', status: 'NEW' as const },
      { id: 'b', status: 'ACCEPTED' as const },
      { id: 'c', status: 'NEW' as const },
    ]
    const lanes = byStatus(orders)
    expect(lanes.NEW.map((o) => o.id)).toEqual(['a', 'c'])
    expect(lanes.ACCEPTED.map((o) => o.id)).toEqual(['b'])
  })

  it('leaves out anything that is no longer open', () => {
    const lanes = byStatus([{ id: 'a', status: 'DONE' as const }, { id: 'b', status: 'CANCELLED' as const }])
    expect(lanes.NEW).toEqual([])
    expect(lanes.ACCEPTED).toEqual([])
  })
})

describe('itemCount', () => {
  it('counts the portions, not the lines', () => {
    expect(itemCount({ lines: [{ quantity: 2 }, { quantity: 3 }] })).toBe(5)
    expect(itemCount({ lines: [] })).toBe(0)
  })
})

describe('the two views', () => {
  it('asks for the open statuses or the finished ones, and the two sets do not overlap', () => {
    expect(viewStatuses('open')).toEqual(['NEW', 'ACCEPTED', 'READY'])
    expect(viewStatuses('served')).toEqual(['DONE', 'CANCELLED'])
    const open = new Set<string>(OPEN_STATUSES)
    expect(CLOSED_STATUSES.some((status) => open.has(status))).toBe(false)
    // Between them they account for every status: no order can fall off both views.
    expect([...OPEN_STATUSES, ...CLOSED_STATUSES].sort()).toEqual([...ORDER_STATUSES].sort())
  })

  it('knows which statuses are finished', () => {
    expect(isClosed('DONE')).toBe(true)
    expect(isClosed('CANCELLED')).toBe(true)
    expect(isClosed('NEW')).toBe(false)
    expect(isClosed('ACCEPTED')).toBe(false)
  })
})

describe('orderTimings', () => {
  const placed = '2026-09-22T12:00:00.000Z'

  it('measures the wait before the start, the making, and what the table felt', () => {
    const timings = orderTimings({ createdAt: placed, acceptedAt: '2026-09-22T12:03:00.000Z', servedAt: '2026-09-22T12:17:00.000Z' })
    expect(timings).toEqual({ toStart: 3, toServe: 14, total: 17 })
  })

  it('leaves a stage that has not happened as null rather than guessing at zero', () => {
    expect(orderTimings({ createdAt: placed, acceptedAt: null, servedAt: null })).toEqual({ toStart: null, toServe: null, total: null })
    const started = orderTimings({ createdAt: placed, acceptedAt: '2026-09-22T12:05:00.000Z', servedAt: null })
    expect(started).toEqual({ toStart: 5, toServe: null, total: null })
  })

  // An order served before it was taken on (a device with the wrong clock, a backfilled row)
  // must not print a negative minute; the stage reads as nothing rather than as impossible.
  it('never reports a negative duration', () => {
    const backwards = orderTimings({ createdAt: '2026-09-22T12:10:00.000Z', acceptedAt: '2026-09-22T12:00:00.000Z', servedAt: '2026-09-22T12:05:00.000Z' })
    expect(backwards.toStart).toBe(0)
    expect(backwards.total).toBe(0)
    expect(backwards.toServe).toBe(5)
  })

  it('reads a row that was served before the stamps existed: a total, and no start', () => {
    const backfilled = orderTimings({ createdAt: placed, acceptedAt: null, servedAt: '2026-09-22T12:20:00.000Z' })
    expect(backfilled).toEqual({ toStart: null, toServe: null, total: 20 })
  })
})
