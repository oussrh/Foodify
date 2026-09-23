// lib/insights-chart.ts
// The arithmetic the report's charts share: a y-axis that ends on a round number, which of the
// x labels there is room for, and a bucket's name short enough to sit under a column.
import type { Grain } from '@/lib/insights'

/**
 * Ticks from zero to a round number at or above `max`, about `target` steps apart: 0 / 5 / 10 /
 * 15, never 0 / 4.3 / 8.6. The step is 1, 2 or 5 times a power of ten. An empty chart still gets
 * an axis (0 to 1), so a quiet month draws as a flat line on the floor rather than a divide by zero.
 */
export function niceTicks(max: number, target = 4): number[] {
  if (!(max > 0)) return [0, 1]
  const rough = max / target
  const power = 10 ** Math.floor(Math.log10(rough))
  // The smallest round step that reaches `max` in at most one step more than asked for.
  const step = ([1, 2, 5, 10].find((m) => m * power * (target + 1) >= max) ?? 10) * power
  // Whole steps only: a count of orders has no half, and a step below one would invent one.
  const whole = Math.max(step, 1)
  const top = Math.ceil(max / whole) * whole
  return Array.from({ length: Math.round(top / whole) + 1 }, (_, i) => i * whole)
}

/** Label every n-th column so at most `room` labels are drawn: 30 days → every 5th on a phone. */
export function labelStride(count: number, room: number): number {
  return Math.max(1, Math.ceil(count / Math.max(1, room)))
}

/** A bucket under its column: `22 Sep`, `Sep`, `2026`. The full name is in the tooltip and the table. */
export function axisLabel(start: Date, grain: Grain): string {
  if (grain === 'year') return String(start.getUTCFullYear())
  if (grain === 'month') return start.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' })
  return start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}
