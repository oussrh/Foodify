import { describe, expect, it } from 'vitest'
import { isSoldOut, SERVICE_DAY_END_HOUR, soldOutUntilNextService, serviceDayStart } from './availability'

// What makes this worth testing is the promise: a dish marked sold out during service comes back
// for the next one, and never in the middle of the one it was marked in.

describe('soldOutUntilNextService', () => {
  it("comes back at the restaurant's own 04:00, not UTC's", () => {
    // 22:00 in New York (02:00 UTC next day): the old 04:00 UTC was 00:00 there, mid-service.
    expect(soldOutUntilNextService(new Date('2026-09-23T02:00:00Z'), 'America/New_York').toISOString()).toBe('2026-09-23T08:00:00.000Z')
    // Paris in summer is UTC+2: its 04:00 is 02:00 UTC.
    expect(soldOutUntilNextService(new Date('2026-09-22T13:00:00Z'), 'Europe/Paris').toISOString()).toBe('2026-09-23T02:00:00.000Z')
  })

  it('takes the next local 04:00 when marked after midnight but before it', () => {
    // 01:30 in Casablanca (UTC+1): the same morning's 04:00, not tomorrow's.
    expect(soldOutUntilNextService(new Date('2026-09-23T00:30:00Z'), 'Africa/Casablanca').toISOString()).toBe('2026-09-23T03:00:00.000Z')
  })

  it('keeps the hour across a daylight-saving change', () => {
    // Marked the evening before Paris moves to summer time: back at 04:00 local, now UTC+2.
    expect(soldOutUntilNextService(new Date('2026-03-28T21:00:00Z'), 'Europe/Paris').toISOString()).toBe('2026-03-29T02:00:00.000Z')
  })

  it('returns the dish at the end of the service day, not at midnight', () => {
    const until = soldOutUntilNextService(new Date('2026-09-22T13:00:00Z'))
    expect(until.toISOString()).toBe('2026-09-23T04:00:00.000Z')
    expect(until.getUTCHours()).toBe(SERVICE_DAY_END_HOUR)
  })

  it('does not bring a dish back in the middle of the service it was marked in', () => {
    // A kitchen marking something off at 22:00 must not see it on the menu again at midnight.
    const marked = new Date('2026-09-22T22:00:00Z')
    expect(soldOutUntilNextService(marked).toISOString()).toBe('2026-09-23T04:00:00.000Z')
    expect(isSoldOut(soldOutUntilNextService(marked), new Date('2026-09-23T00:30:00Z'))).toBe(true)
  })

  it('takes the same morning when a dish is marked in the small hours, not the next one', () => {
    // 01:00 is the tail of the previous evening's service; 04:00 that same day is three hours off.
    expect(soldOutUntilNextService(new Date('2026-09-23T01:00:00Z')).toISOString()).toBe('2026-09-23T04:00:00.000Z')
  })

  it('moves to the next day when marked exactly on the boundary, rather than expiring at once', () => {
    const until = soldOutUntilNextService(new Date('2026-09-23T04:00:00Z'))
    expect(until.toISOString()).toBe('2026-09-24T04:00:00.000Z')
  })

  it('crosses a month end', () => {
    expect(soldOutUntilNextService(new Date('2026-09-30T20:00:00Z')).toISOString()).toBe('2026-10-01T04:00:00.000Z')
  })

  it('leaves the date it was given alone', () => {
    const asked = new Date('2026-09-22T13:00:00Z')
    soldOutUntilNextService(asked)
    expect(asked.toISOString()).toBe('2026-09-22T13:00:00.000Z')
  })
})

describe('serviceDayStart', () => {
  it('is today’s 04:00 after it, and yesterday’s before it, on the restaurant’s clock', () => {
    // Casablanca is UTC+1: 13:30 local is in the day that began at 03:00 UTC.
    expect(serviceDayStart(new Date('2026-09-24T12:30:00Z'), 'Africa/Casablanca').toISOString()).toBe('2026-09-24T03:00:00.000Z')
    // 01:00 local on the 25th is still the 24th's service.
    expect(serviceDayStart(new Date('2026-09-25T00:00:00Z'), 'Africa/Casablanca').toISOString()).toBe('2026-09-24T03:00:00.000Z')
  })

  it('starts at 04:00 itself, not a day earlier', () => {
    expect(serviceDayStart(new Date('2026-09-24T04:00:00Z'), 'UTC').toISOString()).toBe('2026-09-24T04:00:00.000Z')
    expect(serviceDayStart(new Date('2026-09-24T03:59:59Z')).toISOString()).toBe('2026-09-23T04:00:00.000Z')
  })

  it('keeps 04:00 local across a clock change', () => {
    // New York falls back at 02:00 on 1 November 2026: 04:00 EDT the day before, 04:00 EST after.
    expect(serviceDayStart(new Date('2026-11-01T20:00:00Z'), 'America/New_York').toISOString()).toBe('2026-11-01T09:00:00.000Z')
    expect(serviceDayStart(new Date('2026-10-31T20:00:00Z'), 'America/New_York').toISOString()).toBe('2026-10-31T08:00:00.000Z')
    // And springs forward on 8 March 2026: 04:00 EDT is 08:00 UTC.
    expect(serviceDayStart(new Date('2026-03-08T15:00:00Z'), 'America/New_York').toISOString()).toBe('2026-03-08T08:00:00.000Z')
  })
})

describe('isSoldOut', () => {
  const now = new Date('2026-09-22T13:00:00Z')

  it('is false for a dish nobody marked', () => {
    expect(isSoldOut(null, now)).toBe(false)
    expect(isSoldOut(undefined, now)).toBe(false)
  })

  it('is true while the moment is still ahead', () => {
    expect(isSoldOut(new Date('2026-09-23T04:00:00Z'), now)).toBe(true)
  })

  it('is false once the moment has passed, with nothing having run', () => {
    // The whole point: no job resets anything. The next read simply sees an available dish.
    expect(isSoldOut(new Date('2026-09-22T04:00:00Z'), now)).toBe(false)
  })

  it('reads the moment as a string too, which is how it arrives from JSON', () => {
    expect(isSoldOut('2026-09-23T04:00:00.000Z', now)).toBe(true)
    expect(isSoldOut('2026-09-22T04:00:00.000Z', now)).toBe(false)
  })

  it('treats an unreadable value as available rather than hiding a dish over it', () => {
    expect(isSoldOut('not a date', now)).toBe(false)
  })
})
