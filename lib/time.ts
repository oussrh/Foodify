// lib/time.ts
// The clock reads the dashboards need, in one place: a page asks for "seven days ago" or "days
// since", not for Date.now(). `now` is a parameter so a test, or a caller with a fixed instant,
// never touches the real clock.

const DAY_MS = 24 * 60 * 60 * 1000

/** The instant `days` days before `now`. */
export function daysAgo(days: number, now: number = Date.now()): Date {
  return new Date(now - days * DAY_MS)
}

/** Whole days elapsed since `from`, never negative. */
export function daysSince(from: Date, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - from.getTime()) / DAY_MS))
}
