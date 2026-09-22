// lib/availability.ts
// A dish the kitchen has run out of. It stays on the menu, marked, and comes back by itself for
// the next service, so nobody has to remember to turn it on in the morning — the one thing a
// plain on/off flag gets wrong, because a dish quietly left off sells nothing for a week.
//
// `Dish.soldOutUntil` is the moment it returns; null is available. Nothing runs on a timer: a
// menu read after that moment sees an available dish, which is why the return needs no job.

/**
 * The hour (UTC) a service day is taken to end at. Not midnight: a kitchen closing at 23:00 local
 * is still serving after midnight UTC in some of the places this runs, and a dish must not come
 * back while the pass is still open. 04:00 UTC is after the last service and before the first
 * across Europe and North Africa, which is where these restaurants are.
 *
 * It is a fixed hour because `Restaurant` carries no timezone. Adding one would let this be the
 * restaurant's own 4am; until then this is the honest approximation, and the failure mode is a
 * dish returning a few hours late rather than mid-service.
 */
export const SERVICE_DAY_END_HOUR_UTC = 4

/** When a dish marked sold out now should come back: the next end of service day, strictly after `now`. */
export function soldOutUntilNextService(now: Date): Date {
  const until = new Date(now)
  until.setUTCHours(SERVICE_DAY_END_HOUR_UTC, 0, 0, 0)
  if (until <= now) until.setUTCDate(until.getUTCDate() + 1)
  return until
}

/** Whether a dish is sold out at `now`. A moment already passed is available again, with nothing having run. */
export function isSoldOut(soldOutUntil: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!soldOutUntil) return false
  const until = soldOutUntil instanceof Date ? soldOutUntil : new Date(soldOutUntil)
  if (Number.isNaN(until.getTime())) return false
  return until > now
}
