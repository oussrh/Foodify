import { describe, expect, it } from 'vitest'
import { isSoldOut, SERVICE_DAY_END_HOUR_UTC, soldOutUntilNextService } from './availability'

// What makes this worth testing is the promise: a dish marked sold out during service comes back
// for the next one, and never in the middle of the one it was marked in.

describe('soldOutUntilNextService', () => {
  it('returns the dish at the end of the service day, not at midnight', () => {
    const until = soldOutUntilNextService(new Date('2026-09-22T13:00:00Z'))
    expect(until.toISOString()).toBe('2026-09-23T04:00:00.000Z')
    expect(until.getUTCHours()).toBe(SERVICE_DAY_END_HOUR_UTC)
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
