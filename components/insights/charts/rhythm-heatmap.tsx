// components/insights/charts/rhythm-heatmap.tsx
// The week as a grid: a row per weekday, a column per hour, darker where more happened. One hue,
// light to dark, in five steps — a sequential scale, so more is always darker and never a
// different colour. The busiest cell is said in words under the grid; each cell names itself on
// hover. Only the hours anything happened in are drawn.
import { activeHours, hourLabel, peakOf, WEEKDAYS, type RhythmGrid } from '@/lib/insights-rhythm'
import { cn } from '@/lib/utils'

/** The five steps of the scale, as opacities of the first chart colour over the card. */
const STEPS = ['opacity-20', 'opacity-40', 'opacity-60', 'opacity-80', 'opacity-100'] as const

const stepOf = (count: number, most: number) =>
  STEPS[Math.min(STEPS.length - 1, Math.floor((count / most) * STEPS.length - 1e-9))] ?? STEPS[0]

interface RhythmHeatmapProps {
  grid: RhythmGrid
  /** `orders` or `dishes opened`: what a cell counts. */
  noun: string
  /** Named under the grid: the hours are the restaurant's. */
  timeZone: string
}

/**
 * The week as a weekday × hour grid, darker where more happened, with the busiest hour said in
 * words under it.
 */
export function RhythmHeatmap({ grid, noun, timeZone }: RhythmHeatmapProps) {
  const { from, to } = activeHours(grid)
  const hours = Array.from({ length: to - from + 1 }, (_, i) => from + i)
  const peak = peakOf(grid)
  const most = peak?.count ?? 1
  const summary = peak
    ? `Busiest: ${WEEKDAYS[peak.day]} ${hourLabel(peak.hour)}–${hourLabel((peak.hour + 1) % 24)}, ${peak.count.toLocaleString('en-GB')} ${noun}.`
    : `Nothing yet: the grid fills in as ${noun} come in.`

  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={`${noun} by weekday and hour. ${summary}`}
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `2.25rem repeat(${hours.length}, minmax(0, 1fr))` }}
      >
        {WEEKDAYS.map((day, row) => (
          <div key={day} className="contents">
            <span className="self-center text-[11px] text-muted-foreground">{day}</span>
            {hours.map((hour) => {
              const count = grid[row]?.[hour] ?? 0
              return (
                <span
                  key={hour}
                  title={`${day} ${hourLabel(hour)}: ${count.toLocaleString('en-GB')} ${noun}`}
                  className="relative h-6 overflow-hidden rounded-[3px] bg-muted"
                >
                  {count > 0 && <span className={cn('absolute inset-0 bg-chart-1', stepOf(count, most))} />}
                </span>
              )
            })}
          </div>
        ))}
        <span />
        {hours.map((hour) => (
          <span key={hour} className="tnum text-center text-[10px] text-muted-foreground">
            {hour % 3 === 0 ? String(hour).padStart(2, '0') : ''}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <p>{summary} Hours are in {timeZone.replaceAll('_', ' ')} time.</p>
        <span className="flex items-center gap-1" aria-hidden="true">
          Fewer
          {STEPS.map((step) => (
            <span key={step} className={cn('h-2.5 w-2.5 rounded-[2px] bg-chart-1', step)} />
          ))}
          More
        </span>
      </div>
    </div>
  )
}
