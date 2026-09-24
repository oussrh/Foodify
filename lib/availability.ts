// lib/availability.ts
// A dish the kitchen has run out of. It stays on the menu, marked, and comes back by itself for
// the next service, so nobody has to remember to turn it on in the morning — the one thing a
// plain on/off flag gets wrong, because a dish quietly left off sells nothing for a week.
//
// `Dish.soldOutUntil` is the moment it returns; null is available. Nothing runs on a timer: a
// menu read after that moment sees an available dish, which is why the return needs no job.
import { DEFAULT_TIME_ZONE, fromWallClock, wallClock } from '@/lib/time-zone'

/**
 * The local hour a service day is taken to end at, in the restaurant's own zone
 * (`Restaurant.timeZone`). Not midnight: a kitchen closing at 23:00 is still serving at midnight
 * on a busy night, and a dish must not come back while the pass is still open. 04:00 is after the
 * last service and before the first. Before restaurants had a zone this was 04:00 UTC, which in
 * New York is 23:00 — a dish came back mid-service; a restaurant still on UTC keeps that hour.
 */
export const SERVICE_DAY_END_HOUR = 4

/** When a dish marked sold out now should come back: the restaurant's next local 04:00, strictly after `now`. */
export function soldOutUntilNextService(now: Date, timeZone: string = DEFAULT_TIME_ZONE): Date {
  const until = wallClock(now, timeZone)
  const local = until.getTime()
  until.setUTCHours(SERVICE_DAY_END_HOUR, 0, 0, 0)
  if (until.getTime() <= local) until.setUTCDate(until.getUTCDate() + 1)
  return fromWallClock(until, timeZone)
}

/**
 * When the service day `now` falls in began: the restaurant's most recent local 04:00, at or
 * before `now`. A table's bill belongs to one service (lib/table-tab.ts), so last night's
 * 23:30 bill is not this morning's, and the same boundary as a sold-out dish means the kitchen's
 * day ends once, for everything. Worked on the wall clock and converted back, so a night the
 * clocks change still starts at 04:00 local.
 */
export function serviceDayStart(now: Date, timeZone: string = DEFAULT_TIME_ZONE): Date {
  const start = wallClock(now, timeZone)
  const local = start.getTime()
  start.setUTCHours(SERVICE_DAY_END_HOUR, 0, 0, 0)
  if (start.getTime() > local) start.setUTCDate(start.getUTCDate() - 1)
  return fromWallClock(start, timeZone)
}

/** Whether a dish is sold out at `now`. A moment already passed is available again, with nothing having run. */
export function isSoldOut(soldOutUntil: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!soldOutUntil) return false
  const until = soldOutUntil instanceof Date ? soldOutUntil : new Date(soldOutUntil)
  if (Number.isNaN(until.getTime())) return false
  return until > now
}
