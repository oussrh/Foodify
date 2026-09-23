// components/insights/charts/column-chart.tsx
// Counts over time as columns, the series stacked in slot order from the baseline up. Columns
// are capped at 24px and leave the rest of their band as air; stacked segments are parted by a
// 2px gap of the surface rather than an outline; only the top of a column is rounded.
'use client'

import { niceTicks } from '@/lib/insights-chart'
import { ChartShell } from '@/components/insights/charts/chart-shell'
import { FILL, PLOT, type ChartData } from '@/components/insights/charts/series'
import { useChartFrame } from '@/components/insights/charts/use-chart-frame'

const GAP = 2
const RADIUS = 4

/** A column's top segment: square at the bottom, 4px rounded at the top. */
function roundedTop(x: number, y: number, w: number, h: number) {
  const r = Math.min(RADIUS, h, w / 2)
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`
}

interface ColumnChartProps extends ChartData {
  /** The tooltip's total line, per column, when the stack adds up to something worth saying. */
  totals?: string[] | undefined
  label: string
}

/**
 * Counts over time as columns, the series stacked in slot order from the baseline, with a tooltip
 * naming the hovered column and its total.
 */
export function ColumnChart({ axis, titles, series, totals, label }: ColumnChartProps) {
  const [measure, frame] = useChartFrame(axis.length)
  const stackOf = (index: number) => series.reduce((sum, s) => sum + (s.values[index] ?? 0), 0)
  const ticks = niceTicks(Math.max(0, ...axis.map((_, index) => stackOf(index))))
  const top = ticks[ticks.length - 1] ?? 1
  const y = (value: number) => PLOT.top + frame.plotHeight - (value / top) * frame.plotHeight
  const barWidth = Math.max(2, Math.min(24, frame.band * 0.6))

  const column = (index: number) => {
    let base = 0
    const drawn = series.filter((s) => (s.values[index] ?? 0) > 0)
    return drawn.map((s, order) => {
      const value = s.values[index] ?? 0
      const y0 = y(base)
      base += value
      // The gap comes off the top of every segment but the last, so a stack keeps its true height.
      const height = Math.max(0, y0 - y(base) - (order < drawn.length - 1 ? GAP : 0))
      const x = frame.centre(index) - barWidth / 2
      const isTop = order === drawn.length - 1
      return isTop ? (
        <path key={s.label} d={roundedTop(x, y(base), barWidth, height)} className={FILL[s.slot]} />
      ) : (
        <rect key={s.label} x={x} y={y0 - height} width={barWidth} height={height} className={FILL[s.slot]} />
      )
    })
  }

  return (
    <ChartShell measure={measure} frame={frame} ticks={ticks} y={y} label={label} totals={totals} axis={axis} titles={titles} series={series}>
      {axis.map((_, index) => (
        <g key={index}>{column(index)}</g>
      ))}
    </ChartShell>
  )
}
