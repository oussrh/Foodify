// lib/opening-hours.ts
// Restaurant.openingHours is a string column. New data is JSON in the shape below; older rows hold
// free text, which is kept as the `note` so nothing that was typed is lost.

import type { Locale } from './menu'

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export interface Period {
  /** "HH:MM", 24h */
  open: string
  /** "HH:MM"; earlier than `open` means it runs past midnight */
  close: string
}

export interface OpeningHours {
  /** Missing key = not set; empty array = closed that day */
  days: Partial<Record<DayKey, Period[]>>
  note?: string
}

const DAY_NAMES: Record<Locale, Record<DayKey, { short: string; long: string }>> = {
  en: {
    mon: { short: 'Mon', long: 'Monday' },
    tue: { short: 'Tue', long: 'Tuesday' },
    wed: { short: 'Wed', long: 'Wednesday' },
    thu: { short: 'Thu', long: 'Thursday' },
    fri: { short: 'Fri', long: 'Friday' },
    sat: { short: 'Sat', long: 'Saturday' },
    sun: { short: 'Sun', long: 'Sunday' },
  },
  fr: {
    mon: { short: 'Lun', long: 'Lundi' },
    tue: { short: 'Mar', long: 'Mardi' },
    wed: { short: 'Mer', long: 'Mercredi' },
    thu: { short: 'Jeu', long: 'Jeudi' },
    fri: { short: 'Ven', long: 'Vendredi' },
    sat: { short: 'Sam', long: 'Samedi' },
    sun: { short: 'Dim', long: 'Dimanche' },
  },
}

export function dayName(day: DayKey, locale: Locale, form: 'short' | 'long' = 'short'): string {
  return DAY_NAMES[locale][day][form]
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

function isPeriod(p: unknown): p is Period {
  return !!p && typeof p === 'object' && TIME.test((p as Period).open) && TIME.test((p as Period).close)
}

/** Parse the stored string. Never throws; legacy text becomes `{ days: {}, note }`. */
export function parseOpeningHours(raw: string | null | undefined): OpeningHours {
  if (!raw || !raw.trim()) return { days: {} }
  try {
    const json = JSON.parse(raw)
    if (json && typeof json === 'object' && json.days && typeof json.days === 'object') {
      const days: OpeningHours['days'] = {}
      for (const key of DAY_KEYS) {
        const v = json.days[key]
        if (Array.isArray(v)) days[key] = v.filter(isPeriod).slice(0, 2)
      }
      const note = typeof json.note === 'string' && json.note.trim() ? json.note.trim() : undefined
      return { days, note }
    }
  } catch {
    // not JSON: legacy free text
  }
  return { days: {}, note: raw.trim() }
}

export function serializeOpeningHours(hours: OpeningHours): string {
  const days: OpeningHours['days'] = {}
  for (const key of DAY_KEYS) {
    const v = hours.days[key]
    if (v) days[key] = v.filter(isPeriod).slice(0, 2)
  }
  const note = hours.note?.trim()
  if (Object.keys(days).length === 0 && !note) return ''
  return JSON.stringify(note ? { days, note } : { days })
}

export function hasStructuredHours(hours: OpeningHours): boolean {
  return DAY_KEYS.some((d) => hours.days[d] !== undefined)
}

const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

function periodsLabel(periods: Period[], locale: Locale): string {
  if (periods.length === 0) return locale === 'fr' ? 'Fermé' : 'Closed'
  return periods.map((p) => `${p.open}–${p.close}`).join(locale === 'fr' ? ' et ' : ' & ')
}

export interface HoursLine {
  /** e.g. "Mon–Thu" */
  days: string
  /** e.g. "12:00–14:30 & 19:00–23:00" or "Closed" */
  hours: string
}

/** Consecutive days with identical hours are merged into one line. Unset days are skipped. */
export function summarizeOpeningHours(hours: OpeningHours, locale: Locale): HoursLine[] {
  const lines: { from: DayKey; to: DayKey; key: string; hours: string }[] = []
  for (const day of DAY_KEYS) {
    const periods = hours.days[day]
    if (periods === undefined) continue
    const key = JSON.stringify(periods)
    const last = lines[lines.length - 1]
    if (last && last.key === key && DAY_KEYS.indexOf(last.to) === DAY_KEYS.indexOf(day) - 1) last.to = day
    else lines.push({ from: day, to: day, key, hours: periodsLabel(periods, locale) })
  }
  return lines.map((l) => ({
    days: l.from === l.to ? dayName(l.from, locale) : `${dayName(l.from, locale)}–${dayName(l.to, locale)}`,
    hours: l.hours,
  }))
}

export interface OpenStatus {
  open: boolean
  /** "HH:MM" the current period closes at, when open */
  closesAt?: string
  /** "HH:MM" of the next opening, when closed today or later this week */
  opensAt?: string
  /** Day the next opening falls on, when it is not today */
  opensOn?: DayKey
}

/** Whether the restaurant is open at `now` (device time; guests are on site). */
export function openStatus(hours: OpeningHours, now = new Date()): OpenStatus | null {
  if (!hasStructuredHours(hours)) return null
  const todayIndex = (now.getDay() + 6) % 7 // Monday = 0
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const periodsOf = (offset: number) => hours.days[DAY_KEYS[(todayIndex + offset + 7) % 7]] ?? []

  // A period from yesterday that runs past midnight may still be open.
  for (const p of periodsOf(-1)) {
    const o = minutes(p.open)
    const c = minutes(p.close)
    if (c < o && nowMin < c) return { open: true, closesAt: p.close }
  }
  for (const p of periodsOf(0)) {
    const o = minutes(p.open)
    const c = minutes(p.close)
    const inside = c < o ? nowMin >= o : nowMin >= o && nowMin < c
    if (inside) return { open: true, closesAt: p.close }
  }
  // Next opening today
  const later = periodsOf(0)
    .filter((p) => minutes(p.open) > nowMin)
    .sort((a, b) => minutes(a.open) - minutes(b.open))[0]
  if (later) return { open: false, opensAt: later.open }
  // Next opening on a following day
  for (let offset = 1; offset <= 7; offset++) {
    const first = [...periodsOf(offset)].sort((a, b) => minutes(a.open) - minutes(b.open))[0]
    if (first) return { open: false, opensAt: first.open, opensOn: DAY_KEYS[(todayIndex + offset) % 7] }
  }
  return { open: false }
}
