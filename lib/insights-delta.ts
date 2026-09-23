// lib/insights-delta.ts
// How a figure moved against the window before it, in the unit a reader thinks in: a count, an
// amount or a duration by a percentage; a rate by percentage points (a 4 % order rate going to
// 6 % is "+2 pts", not "+50 %"). Whether the move is good depends on the figure, so the caller
// says which way is better.

/** Which way is better for a figure. */
export type Better = 'up' | 'down'

/** A move said three ways: in words, by direction, and whether that direction is good here. */
export interface Delta {
  /** `+12%`, `−3 pts`, `No change`. */
  text: string
  direction: 'up' | 'down' | 'flat'
  tone: 'good' | 'bad' | 'neutral'
}

function deltaOf(change: number, unit: string, better: Better): Delta {
  const rounded = Math.round(change)
  if (rounded === 0) return { text: 'No change', direction: 'flat', tone: 'neutral' }
  const direction = rounded > 0 ? 'up' : 'down'
  // U+2212, the minus sign: a hyphen is shorter than a plus and reads as a dash beside one.
  const text = `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}${unit}`
  return { text, direction, tone: direction === better ? 'good' : 'bad' }
}

/** A count, an amount or a duration against the one before, in percent; null from nothing. */
export function percentDelta(current: number | null, previous: number | null, better: Better): Delta | null {
  if (current === null || previous === null || previous === 0) return null
  return deltaOf(((current - previous) / previous) * 100, '%', better)
}

/** A rate against the one before, in percentage points; null when either has no rate. */
export function pointsDelta(current: number | null, previous: number | null, better: Better): Delta | null {
  if (current === null || previous === null) return null
  return deltaOf(current - previous, ' pts', better)
}
