// components/insights/charts/line-chart.tsx
// Averages over time as 2px lines on one axis. A column with no figure (nothing was served that
// day) breaks the line rather than dropping it to zero: an average of nothing is not a fast
// kitchen. Hovering draws a crosshair and a ringed dot on every line at that column.
'use client'

import { niceTicks } from '@/lib/insights-chart'
import { ChartShell } from '@/components/insights/charts/chart-shell'
import { FILL, PLOT, STROKE, type ChartData, type ChartSeries } from '@/components/insights/charts/series'
import { useChartFrame } from '@/components/insights/charts/use-chart-frame'

/** The path of a series, a new `M` after every gap; a lone point is drawn as a dot instead. */
function pathOf(values: (number | null)[], x: (index: number) => number, y: (value: number) => number) {
  let pen = false
  return values
    .map((value, index) => {
      if (value === null) {
        pen = false
        return ''
      }
      const move = pen ? 'L' : 'M'
      pen = true
      return `${move}${x(index)},${y(value)}`
    })
    .join('')
}

/** Points with no neighbour on either side, which a path alone would not show. */
const isolated = (values: (number | null)[], index: number) =>
  values[index] !== null && (values[index - 1] ?? null) === null && (values[index + 1] ?? null) === null

interface LineChartProps extends ChartData {
  label: string
  /** Appended to the y ticks: ` min`. */
  unit?: string
}

export function LineChart({ axis, titles, series, label, unit }: LineChartProps) {
  const [measure, frame] = useChartFrame(axis.length)
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null)
  const ticks = niceTicks(Math.max(0, ...all))
  const top = ticks[ticks.length - 1] ?? 1
  const y = (value: number) => PLOT.top + frame.plotHeight - (value / top) * frame.plotHeight

  const dot = (s: ChartSeries, index: number, key: string) => {
    const value = s.values[index] ?? null
    if (value === null) return null
    return (
      <circle key={key} cx={frame.centre(index)} cy={y(value)} r={4} className={`${FILL[s.slot]} stroke-card`} strokeWidth={2} />
    )
  }

  return (
    <ChartShell measure={measure} frame={frame} ticks={ticks} y={y} label={label} unit={unit} axis={axis} titles={titles} series={series}>
      {series.map((s) => (
        <g key={s.label}>
          <path d={pathOf(s.values, frame.centre, y)} fill="none" className={STROKE[s.slot]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {s.values.map((_, index) => (isolated(s.values, index) ? dot(s, index, `lone-${index}`) : null))}
        </g>
      ))}
      {frame.hover !== null && (
        <g>
          <line x1={frame.centre(frame.hover)} x2={frame.centre(frame.hover)} y1={PLOT.top} y2={PLOT.top + frame.plotHeight} className="stroke-border-strong" strokeWidth={1} />
          {series.map((s) => dot(s, frame.hover ?? 0, `hover-${s.label}`))}
        </g>
      )}
    </ChartShell>
  )
}
