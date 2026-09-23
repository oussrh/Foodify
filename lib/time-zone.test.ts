import { describe, expect, it } from 'vitest'
import { DEFAULT_TIME_ZONE, fromWallClock, isTimeZone, timeZoneLabel, timeZones, wallClock } from './time-zone'

const at = (iso: string) => new Date(iso)

describe('isTimeZone', () => {
  it('knows the zones and refuses what is not one', () => {
    expect(isTimeZone('Europe/Paris')).toBe(true)
    expect(isTimeZone('UTC')).toBe(true)
    expect(isTimeZone('Mars/Olympus')).toBe(false)
    expect(isTimeZone('')).toBe(false)
  })
})

describe('timeZones', () => {
  it('lists UTC first, once, and the named zones after it', () => {
    const zones = timeZones()
    expect(zones[0]).toBe(DEFAULT_TIME_ZONE)
    expect(zones.filter((z) => z === 'UTC')).toHaveLength(1)
    expect(zones).toContain('Africa/Casablanca')
  })
})

describe('wallClock', () => {
  it('is the local time, written in UTC fields', () => {
    // Paris is UTC+2 in September, UTC+1 in January.
    expect(wallClock(at('2026-09-22T02:30:00Z'), 'Europe/Paris').toISOString()).toBe('2026-09-22T04:30:00.000Z')
    expect(wallClock(at('2026-01-15T02:30:00Z'), 'Europe/Paris').toISOString()).toBe('2026-01-15T03:30:00.000Z')
    // Behind UTC, the local date can still be the day before.
    expect(wallClock(at('2026-09-22T02:30:00Z'), 'America/New_York').toISOString()).toBe('2026-09-21T22:30:00.000Z')
  })

  it('is the instant itself in UTC', () => {
    expect(wallClock(at('2026-09-22T02:30:00Z'), 'UTC').toISOString()).toBe('2026-09-22T02:30:00.000Z')
  })
})

describe('fromWallClock', () => {
  it('finds the instant a local time happens, on either side of a daylight-saving change', () => {
    expect(fromWallClock(at('2026-09-22T04:00:00Z'), 'Europe/Paris').toISOString()).toBe('2026-09-22T02:00:00.000Z')
    expect(fromWallClock(at('2026-01-15T04:00:00Z'), 'Europe/Paris').toISOString()).toBe('2026-01-15T03:00:00.000Z')
    // 29 March 2026: Paris moves from +1 to +2 at 01:00 UTC; 04:00 local that morning is +2.
    expect(fromWallClock(at('2026-03-29T04:00:00Z'), 'Europe/Paris').toISOString()).toBe('2026-03-29T02:00:00.000Z')
  })

  it('undoes wallClock', () => {
    const instant = at('2026-11-01T06:15:00Z')
    for (const zone of ['UTC', 'Africa/Casablanca', 'America/Los_Angeles', 'Asia/Kolkata']) {
      expect(fromWallClock(wallClock(instant, zone), zone).toISOString()).toBe(instant.toISOString())
    }
  })
})

describe('timeZoneLabel', () => {
  it('names the zone with its offset at that moment, and UTC plainly', () => {
    expect(timeZoneLabel('America/New_York', at('2026-09-22T12:00:00Z'))).toBe('America/New York · GMT-4')
    expect(timeZoneLabel('America/New_York', at('2026-01-15T12:00:00Z'))).toBe('America/New York · GMT-5')
    expect(timeZoneLabel('UTC')).toBe('UTC')
  })
})
