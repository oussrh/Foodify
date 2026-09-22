import { describe, expect, it } from 'vitest'
import {
  bucketLabel,
  bucketStarts,
  conversion,
  formatDuration,
  parseGrain,
  totalsOf,
  windowStart,
  type InsightsBucket,
} from './insights'

const bucket = (over: Partial<InsightsBucket> = {}): InsightsBucket => ({
  start: new Date('2026-09-22T00:00:00Z'),
  views: 0,
  arViews: 0,
  cartAdds: 0,
  guestOrders: 0,
  staffOrders: 0,
  acceptSeconds: null,
  serveSeconds: null,
  ...over,
})

describe('parseGrain', () => {
  it('takes the four grains', () => {
    expect(['day', 'week', 'month', 'year'].map(parseGrain)).toEqual(['day', 'week', 'month', 'year'])
  })

  it('reads anything else as daily rather than failing the page', () => {
    expect(parseGrain('hour')).toBe('day')
    expect(parseGrain(undefined)).toBe('day')
    expect(parseGrain(7)).toBe('day')
  })
})

describe('windowStart', () => {
  const now = new Date('2026-09-22T14:30:00Z')

  it('counts back to the first of the buckets shown, and starts at its midnight', () => {
    expect(windowStart('day', now).toISOString()).toBe('2026-08-24T00:00:00.000Z')
    expect(windowStart('month', now).toISOString()).toBe('2025-10-01T00:00:00.000Z')
  })

  it('includes the bucket happening now', () => {
    expect(windowStart('year', now).getUTCFullYear()).toBe(2022)
  })

  it('starts on a bucket boundary, not on `now` shifted back', () => {
    // Otherwise the oldest month is half a month, and the remainder becomes a thirteenth bucket.
    expect(windowStart('month', now).getUTCDate()).toBe(1)
    expect(windowStart('year', now).toISOString()).toBe('2022-01-01T00:00:00.000Z')
    // A week is grouped from Monday, the way Postgres date_trunc does it.
    expect(windowStart('week', now).getUTCDay()).toBe(1)
  })

  it('leaves the date it was given alone', () => {
    const asked = new Date('2026-09-22T14:30:00Z')
    windowStart('week', asked)
    expect(asked.toISOString()).toBe('2026-09-22T14:30:00.000Z')
  })
})

describe('totalsOf', () => {
  it('adds the counts up', () => {
    const totals = totalsOf([bucket({ views: 10, cartAdds: 3, guestOrders: 2 }), bucket({ views: 5, staffOrders: 1 })])
    expect(totals).toMatchObject({ views: 15, cartAdds: 3, guestOrders: 2, staffOrders: 1 })
  })

  it('weights an average by the orders behind it, not by the bucket', () => {
    // One slow order on a quiet day must not weigh the same as eighty quick ones on a busy one.
    const quiet = bucket({ guestOrders: 1, serveSeconds: 3600 })
    const busy = bucket({ guestOrders: 99, serveSeconds: 600 })
    expect(totalsOf([quiet, busy]).serveSeconds).toBeCloseTo((3600 + 99 * 600) / 100, 5)
  })

  it('answers null for a stage nothing reached', () => {
    expect(totalsOf([bucket({ views: 4 })]).serveSeconds).toBeNull()
    expect(totalsOf([]).acceptSeconds).toBeNull()
  })

  it('ignores a bucket that timed nothing, rather than reading it as zero', () => {
    const timed = bucket({ guestOrders: 2, acceptSeconds: 300 })
    const untimed = bucket({ guestOrders: 5, acceptSeconds: null })
    expect(totalsOf([timed, untimed]).acceptSeconds).toBe(300)
  })
})

describe('formatDuration', () => {
  it('says minutes under the hour and hours above it', () => {
    expect(formatDuration(240)).toBe('4 min')
    expect(formatDuration(4320)).toBe('1 h 12 min')
  })

  it('reads a stage nothing reached as a dash, not a zero', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(Number.NaN)).toBe('—')
  })

  it('reads a clock that ran backwards as nothing, never as a negative wait', () => {
    expect(formatDuration(-90)).toBe('0 min')
  })
})

describe('conversion', () => {
  it('is a whole percentage of the readers', () => {
    expect(conversion(12, 50)).toBe(24)
  })

  it('is null when nobody read the menu, not zero', () => {
    expect(conversion(0, 0)).toBeNull()
  })
})

describe('bucketLabel', () => {
  const start = new Date('2026-09-07T00:00:00Z')

  it('names a bucket by its grain', () => {
    expect(bucketLabel(start, 'day')).toBe('7 Sept 2026')
    expect(bucketLabel(start, 'week')).toBe('Week of 7 Sept 2026')
    expect(bucketLabel(start, 'month')).toBe('September 2026')
    expect(bucketLabel(start, 'year')).toBe('2026')
  })

  it('reads the bucket in UTC, the way the database grouped it', () => {
    // 23:30 UTC is the next day in some places; the label must still be the bucket's own day.
    expect(bucketLabel(new Date('2026-09-07T23:30:00Z'), 'day')).toBe('7 Sept 2026')
  })
})

describe('bucketStarts', () => {
  const now = new Date('2026-09-22T14:30:00Z')

  it('is one start per bucket, oldest first, ending on the bucket happening now', () => {
    const days = bucketStarts('day', now)
    expect(days).toHaveLength(30)
    expect(days[0]!.toISOString()).toBe('2026-08-24T00:00:00.000Z')
    expect(days.at(-1)!.toISOString()).toBe('2026-09-22T00:00:00.000Z')
  })

  it('steps a month at a time without a month-end rolling over', () => {
    const months = bucketStarts('month', new Date('2026-03-31T12:00:00Z'))
    expect(months.map((m) => m.getUTCDate())).toEqual(Array(12).fill(1))
    expect(months.at(-1)!.toISOString()).toBe('2026-03-01T00:00:00.000Z')
  })

  it('hands out its own dates, so a caller mutating one cannot shift the next', () => {
    const [first, second] = bucketStarts('day', now)
    first!.setUTCFullYear(1999)
    expect(second!.getUTCFullYear()).toBe(2026)
  })
})
