// components/insights/charts/chart-parts.tsx
// The pieces the column and line charts share: the recessive grid with its round ticks, the
// labels under the columns (as many as fit), the full-height hover bands that are bigger than
// any mark, and the tooltip that names the column and every series in it.
'use client'

import { labelStride } from '@/lib/insights-chart'
import { cn } from '@/lib/utils'
import { BG, PLOT, type ChartSeries } from '@/components/insights/charts/series'

interface GridProps {
  ticks: number[]
  width: number
  y: (value: number) => number
  unit?: string | undefined
}

/** Hairline gridlines at each tick, the baseline one step stronger; tick text in muted ink. */
export function Grid({ ticks, width, y, unit = '' }: GridProps) {
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={PLOT.left}
            x2={width - PLOT.right}
            y1={y(tick)}
            y2={y(tick)}
            className={tick === 0 ? 'stroke-border-strong' : 'stroke-border'}
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
          <text x={PLOT.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className="tnum fill-muted-foreground text-[11px]">
            {`${tick.toLocaleString('en-GB')}${unit}`}
          </text>
        </g>
      ))}
    </g>
  )
}

interface AxisLabelsProps {
  labels: string[]
  centre: (index: number) => number
  width: number
}

/** Every n-th label, so they never collide: roughly one per 56px of plot. */
export function AxisLabels({ labels, centre, width }: AxisLabelsProps) {
  const stride = labelStride(labels.length, Math.floor((width - PLOT.left - PLOT.right) / 56))
  // Counted from the newest column, so the one that is happening now always has its label.
  const last = labels.length - 1
  return (
    <g aria-hidden="true">
      {labels.map((label, index) =>
        (last - index) % stride === 0 ? (
          <text key={index} x={centre(index)} y={PLOT.height - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">
            {label}
          </text>
        ) : null,
      )}
    </g>
  )
}

interface HitBandsProps {
  count: number
  band: number
  hover: number | null
  onHover: (index: number | null) => void
}

/** One full-height target per column, washed when hovered. */
export function HitBands({ count, band, hover, onHover }: HitBandsProps) {
  return (
    <g onPointerLeave={() => onHover(null)}>
      {Array.from({ length: count }, (_, index) => (
        <rect
          key={index}
          x={PLOT.left + band * index}
          y={PLOT.top}
          width={band}
          height={PLOT.height - PLOT.top - PLOT.bottom}
          className={cn('fill-transparent', hover === index && 'fill-muted')}
          onPointerEnter={() => onHover(index)}
        />
      ))}
    </g>
  )
}

interface TooltipProps {
  title: string
  series: ChartSeries[]
  index: number
  x: number
  width: number
  total?: string | undefined
}

/** The hovered column in words, kept inside the chart's box. */
export function Tooltip({ title, series, index, x, width, total }: TooltipProps) {
  const left = Math.min(Math.max(x - 88, 0), width - 176)
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 w-44 rounded-md border border-border bg-popover p-2.5 text-xs shadow-popover"
      style={{ left }}
    >
      <p className="mb-1.5 font-medium">{title}</p>
      <ul className="flex flex-col gap-1">
        {series.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className={cn('h-2 w-2 shrink-0 rounded-[2px]', BG[s.slot])} aria-hidden="true" />
            <span className="flex-1 text-muted-foreground">{s.label}</span>
            <span className="tnum font-medium">{s.display[index]}</span>
          </li>
        ))}
      </ul>
      {total && <p className="mt-1.5 border-t border-border pt-1.5 text-right font-medium">{total}</p>}
    </div>
  )
}
