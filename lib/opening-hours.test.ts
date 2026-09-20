import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  hasStructuredHours,
  openStatus,
  parseOpeningHours,
  serializeOpeningHours,
  summarizeOpeningHours,
  type OpeningHours,
} from './opening-hours'

const lunchAndDinner = [
  { open: '12:00', close: '14:30' },
  { open: '19:00', close: '23:00' },
]

describe('parseOpeningHours', () => {
  it('returns no days and no note for an empty column', () => {
    expect(parseOpeningHours(null)).toEqual({ days: {} })
    expect(parseOpeningHours('   ')).toEqual({ days: {} })
  })

  it('keeps legacy free text as the note so nothing typed is lost', () => {
    expect(parseOpeningHours('  Open every day 10-22  ')).toEqual({ days: {}, note: 'Open every day 10-22' })
  })

  it('reads the JSON shape and trims the note', () => {
    const raw = JSON.stringify({ days: { mon: lunchAndDinner, sun: [] }, note: ' Closed on holidays ' })
    expect(parseOpeningHours(raw)).toEqual({ days: { mon: lunchAndDinner, sun: [] }, note: 'Closed on holidays' })
  })

  it('drops a period whose time is not HH:MM and keeps at most two per day', () => {
    const raw = JSON.stringify({
      days: { tue: [{ open: '9:00', close: '12:00' }, { open: '12:00', close: '14:00' }, { open: '15:00', close: '18:00' }, { open: '19:00', close: '22:00' }] },
    })
    expect(parseOpeningHours(raw).days.tue).toEqual([
      { open: '12:00', close: '14:00' },
      { open: '15:00', close: '18:00' },
    ])
  })

  it('treats JSON without a days object as legacy text', () => {
    expect(parseOpeningHours('[1,2]')).toEqual({ days: {}, note: '[1,2]' })
    expect(parseOpeningHours('{"note":"x"}')).toEqual({ days: {}, note: '{"note":"x"}' })
  })
})

describe('serializeOpeningHours', () => {
  it('writes an empty string when there is nothing to store', () => {
    expect(serializeOpeningHours({ days: {} })).toBe('')
    expect(serializeOpeningHours({ days: {}, note: '  ' })).toBe('')
  })

  it('round-trips through parseOpeningHours', () => {
    const hours: OpeningHours = { days: { mon: lunchAndDinner, sat: [] }, note: 'Ramadan hours differ' }
    expect(parseOpeningHours(serializeOpeningHours(hours))).toEqual(hours)
  })

  it('omits the note key when the note is blank', () => {
    expect(serializeOpeningHours({ days: { mon: [] }, note: '' })).toBe('{"days":{"mon":[]}}')
  })
})

describe('hasStructuredHours', () => {
  it('is false for a note-only value and true once any day is set, even to closed', () => {
    expect(hasStructuredHours({ days: {}, note: 'call us' })).toBe(false)
    expect(hasStructuredHours({ days: { sun: [] } })).toBe(true)
  })
})

describe('summarizeOpeningHours', () => {
  it('merges consecutive days with identical hours into one line', () => {
    const hours: OpeningHours = { days: { mon: lunchAndDinner, tue: lunchAndDinner, wed: lunchAndDinner, fri: [{ open: '19:00', close: '23:00' }], sun: [] } }
    expect(summarizeOpeningHours(hours, 'en')).toEqual([
      { days: 'Mon–Wed', hours: '12:00–14:30 & 19:00–23:00' },
      { days: 'Fri', hours: '19:00–23:00' },
      { days: 'Sun', hours: 'Closed' },
    ])
  })

  it('does not merge identical hours across an unset day', () => {
    const hours: OpeningHours = { days: { mon: lunchAndDinner, wed: lunchAndDinner } }
    expect(summarizeOpeningHours(hours, 'en').map((l) => l.days)).toEqual(['Mon', 'Wed'])
  })

  it('uses French day names, joiner and closed label', () => {
    const hours: OpeningHours = { days: { sat: lunchAndDinner, sun: [] } }
    expect(summarizeOpeningHours(hours, 'fr')).toEqual([
      { days: 'Sam', hours: '12:00–14:30 et 19:00–23:00' },
      { days: 'Dim', hours: 'Fermé' },
    ])
  })
})

describe('openStatus', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  // 2026-09-21 is a Monday.
  const at = (isoLocal: string) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(isoLocal))
    return new Date()
  }

  it('is null when only a note exists', () => {
    expect(openStatus({ days: {}, note: 'call us' })).toBeNull()
  })

  it('is open inside a period and says when it closes', () => {
    expect(openStatus({ days: { mon: lunchAndDinner } }, at('2026-09-21T13:00:00'))).toEqual({ open: true, closesAt: '14:30' })
  })

  it('is closed between two periods and says when it reopens today', () => {
    expect(openStatus({ days: { mon: lunchAndDinner } }, at('2026-09-21T16:00:00'))).toEqual({ open: false, opensAt: '19:00' })
  })

  it('points to the next day that opens when today is done', () => {
    const hours: OpeningHours = { days: { mon: lunchAndDinner, tue: [], thu: [{ open: '10:00', close: '15:00' }] } }
    expect(openStatus(hours, at('2026-09-21T23:30:00'))).toEqual({ open: false, opensAt: '10:00', opensOn: 'thu' })
  })

  it('stays open after midnight for a period that closes past midnight', () => {
    const hours: OpeningHours = { days: { mon: [{ open: '20:00', close: '02:00' }] } }
    expect(openStatus(hours, at('2026-09-22T01:30:00'))).toEqual({ open: true, closesAt: '02:00' })
    expect(openStatus(hours, at('2026-09-22T02:00:00'))).toEqual({ open: false, opensAt: '20:00', opensOn: 'mon' })
  })

  it('is closed with no next opening when every set day is closed', () => {
    expect(openStatus({ days: { mon: [], tue: [] } }, at('2026-09-21T12:00:00'))).toEqual({ open: false })
  })
})
