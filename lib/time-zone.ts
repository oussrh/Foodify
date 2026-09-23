// lib/time-zone.ts
// A restaurant's own clock. `Restaurant.timeZone` is an IANA zone ("Africa/Casablanca",
// "Europe/Paris"); what the app needs of it is two conversions — the wall clock in the restaurant
// at an instant, and the instant of a wall-clock time there — and both go through `Intl`, which
// carries the zone rules and their daylight-saving changes, so no table here goes stale.
//
// A "wall clock" is written as a Date whose UTC fields are the local time: 2026-09-22 04:00 in
// Paris is `new Date('2026-09-22T04:00:00Z')`. It is never an instant; it is a way to do calendar
// arithmetic (the next 04:00, the start of the day) with the UTC methods, which have no DST.

/** The zone a restaurant is in until a manager sets one: what every figure used before there was a setting. */
export const DEFAULT_TIME_ZONE = 'UTC'

/** Whether `value` is a zone this runtime knows. */
export function isTimeZone(value: string): boolean {
  if (!value) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

/** Every zone the runtime knows, UTC first, for the settings select. */
export function timeZones(): string[] {
  const known = Intl.supportedValuesOf('timeZone')
  return [DEFAULT_TIME_ZONE, ...known.filter((zone) => zone !== DEFAULT_TIME_ZONE)]
}

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone)
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    formatters.set(timeZone, f)
  }
  return f
}

/** The wall clock in `timeZone` at `instant` (see the header for how it is written). */
export function wallClock(instant: Date, timeZone: string): Date {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(instant).map((p) => [p.type, p.value]))
  const n = (key: string) => Number(parts[key])
  return new Date(Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'), instant.getUTCMilliseconds()))
}

/** How far `timeZone` is ahead of UTC at `instant`, in milliseconds. */
function offsetAt(instant: Date, timeZone: string): number {
  return wallClock(instant, timeZone).getTime() - instant.getTime()
}

/**
 * The instant a wall-clock time in `timeZone` happens. Taken twice because the offset to apply
 * is the one in force at the answer, not at the question: the first guess can sit on the other
 * side of a daylight-saving change. A time the change skips (02:30 on a spring-forward night)
 * lands an hour on; nothing here asks for one.
 */
export function fromWallClock(wall: Date, timeZone: string): Date {
  const guess = new Date(wall.getTime() - offsetAt(wall, timeZone))
  return new Date(wall.getTime() - offsetAt(guess, timeZone))
}

/** A zone as the settings select shows it, with its offset now: "Africa/Casablanca · GMT+1". */
export function timeZoneLabel(timeZone: string, now: Date = new Date()): string {
  const offset = new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(now)
    .find((part) => part.type === 'timeZoneName')?.value
  return offset && timeZone !== DEFAULT_TIME_ZONE ? `${timeZone.replaceAll('_', ' ')} · ${offset}` : timeZone
}
