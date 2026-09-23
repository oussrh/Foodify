// lib/insights-rhythm.ts
// The week's shape: a count at every weekday and hour, laid out as a grid for the heatmap, with
// its busiest cell and the hours worth drawing. Hours are the restaurant's own (lib/time-zone.ts).

/** Monday first: a restaurant's week is a working week, and ISO numbers it that way. */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** Seven rows (Monday first) of twenty-four hours. */
export type RhythmGrid = number[][]

/** A grid from `(ISO weekday, hour, count)` rows; a cell no row reached is zero. */
export function rhythmGrid(rows: readonly { dow: number; hour: number; count: number }[]): RhythmGrid {
  const grid = WEEKDAYS.map(() => Array.from({ length: 24 }, () => 0))
  for (const row of rows) {
    const day = grid[row.dow - 1]
    if (day && row.hour >= 0 && row.hour < 24) day[row.hour] = (day[row.hour] ?? 0) + row.count
  }
  return grid
}

/** The busiest weekday and hour, the earliest on a tie; null for an empty grid. */
export function peakOf(grid: RhythmGrid): { day: number; hour: number; count: number } | null {
  const cells = grid.flatMap((hours, day) => hours.map((count, hour) => ({ day, hour, count })))
  return cells.reduce<{ day: number; hour: number; count: number } | null>(
    (peak, cell) => (cell.count > (peak?.count ?? 0) ? cell : peak),
    null,
  )
}

/**
 * The span of hours to draw: the first to the last hour anything happened in, widened to at
 * least eight so a lunch-only week still reads as a day. The whole day when nothing happened.
 */
export function activeHours(grid: RhythmGrid): { from: number; to: number } {
  const busy = Array.from({ length: 24 }, (_, hour) => grid.some((hours) => (hours[hour] ?? 0) > 0))
  const from = busy.indexOf(true)
  if (from === -1) return { from: 0, to: 23 }
  const to = busy.lastIndexOf(true)
  const short = Math.max(0, 8 - (to - from + 1))
  // Centred on the busy hours, and pulled back from midnight so eight still fit in the day.
  const start = Math.max(0, Math.min(from - Math.floor(short / 2), 16))
  return { from: start, to: Math.max(to, start + 7) }
}

/** An hour as a timetable writes it: `09:00`. */
export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}
