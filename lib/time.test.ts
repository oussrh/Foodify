import { afterEach, describe, expect, it, vi } from 'vitest'
import { daysAgo, daysSince } from './time'

const NOON = Date.UTC(2026, 8, 20, 12, 0, 0)

describe('daysAgo', () => {
  it('subtracts whole days from the given instant', () => {
    expect(daysAgo(7, NOON).toISOString()).toBe('2026-09-13T12:00:00.000Z')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reads the clock only when no instant is given', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOON))
    expect(daysAgo(1).toISOString()).toBe('2026-09-19T12:00:00.000Z')
  })
})

describe('daysSince', () => {
  it('counts completed days, ignoring the remainder', () => {
    expect(daysSince(new Date('2026-09-01T00:00:00Z'), NOON)).toBe(19)
    expect(daysSince(new Date('2026-09-19T13:00:00Z'), NOON)).toBe(0)
  })

  it('is zero, not negative, for an instant in the future', () => {
    expect(daysSince(new Date('2026-10-01T00:00:00Z'), NOON)).toBe(0)
  })
})
