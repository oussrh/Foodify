// components/insights/charts/series.ts
// What every chart is handed: one entry per series, in slot order, with its values already
// written as a reader says them (a function cannot cross from the server page to a client chart,
// so the page formats and the chart only draws). Colours are slots of the design system's chart
// palette (`--chart-1..3` in globals.css), spelled out so Tailwind sees the class names.

export type Slot = 1 | 2 | 3

export interface ChartSeries {
  label: string
  slot: Slot
  /** One per column; null where the figure does not exist (no order was served that day). */
  values: (number | null)[]
  /** The same values in words, for the tooltip. */
  display: string[]
}

export interface ChartData {
  /** Short labels under the columns. */
  axis: string[]
  /** The full name of each column, the tooltip's heading. */
  titles: string[]
  series: ChartSeries[]
}

export const FILL: Record<Slot, string> = { 1: 'fill-chart-1', 2: 'fill-chart-2', 3: 'fill-chart-3' }
export const STROKE: Record<Slot, string> = { 1: 'stroke-chart-1', 2: 'stroke-chart-2', 3: 'stroke-chart-3' }
export const BG: Record<Slot, string> = { 1: 'bg-chart-1', 2: 'bg-chart-2', 3: 'bg-chart-3' }

/** The plot's margins: room for the y ticks on the left and the labels underneath. */
export const PLOT = { height: 200, top: 8, bottom: 24, left: 44, right: 8 } as const
