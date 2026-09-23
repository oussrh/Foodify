// components/insights/charts/chart-shell.tsx
// What every time chart draws around its marks: the measured box, the grid, the hover bands, the
// labels underneath and the tooltip. A chart hands in its marks and its scale; this does the rest.
'use client'

import { AxisLabels, Grid, HitBands, Tooltip } from '@/components/insights/charts/chart-parts'
import { PLOT, type ChartData } from '@/components/insights/charts/series'
import type { ChartGeometry } from '@/components/insights/charts/use-chart-frame'

interface ChartShellProps extends ChartData {
  measure: (node: HTMLDivElement | null) => void
  frame: ChartGeometry
  ticks: number[]
  y: (value: number) => number
  label: string
  unit?: string | undefined
  totals?: string[] | undefined
  /** The marks, drawn over the hover bands and under the labels; they never take the pointer. */
  children: React.ReactNode
}

/**
 * What a time chart draws around its marks: the measured box, grid, hover bands, labels and
 * tooltip. Nothing is drawn until the box's real width is known.
 */
export function ChartShell({ measure, frame, ticks, y, label, unit, totals, axis, titles, series, children }: ChartShellProps) {
  return (
    <div ref={measure} className="relative" style={{ minHeight: PLOT.height }}>
      {frame.ready && (
        <svg width={frame.width} height={PLOT.height} role="img" aria-label={label} className="block overflow-visible">
          <Grid ticks={ticks} width={frame.width} y={y} unit={unit} />
          <HitBands count={axis.length} band={frame.band} hover={frame.hover} onHover={frame.setHover} />
          <g className="pointer-events-none">{children}</g>
          <AxisLabels labels={axis} centre={frame.centre} width={frame.width} />
        </svg>
      )}
      {frame.hover !== null && (
        <Tooltip
          title={titles[frame.hover] ?? ''}
          series={series}
          index={frame.hover}
          x={frame.centre(frame.hover)}
          width={frame.width}
          total={totals?.[frame.hover]}
        />
      )}
    </div>
  )
}
