// components/insights/charts/use-chart-frame.ts
// The measured box a chart draws in and the column under the pointer. SVG is drawn at the
// container's real width rather than scaled through a viewBox, so the axis text stays the size
// of the page's text on a phone and on a desktop.
'use client'

import { useEffect, useState } from 'react'
import { PLOT } from '@/components/insights/charts/series'

/** The chart's width, the hovered column and the column geometry, as a chart reads them while drawing. */
export interface ChartGeometry {
  /** False until the box has been measured: nothing is drawn at a width that is not the real one. */
  ready: boolean
  width: number
  hover: number | null
  setHover: (index: number | null) => void
  plotHeight: number
  band: number
  centre: (index: number) => number
}

/**
 * The chart's measured width, the column under the pointer and the column geometry; the ref setter
 * is returned apart from the geometry the chart draws with.
 */
export function useChartFrame(columns: number) {
  // A callback ref held in state rather than `useRef`: the geometry below is read while rendering,
  // and a ref may not be.
  const [node, measure] = useState<HTMLDivElement | null>(null)
  // Unknown until the first measure. A guess would be drawn at the wrong width on the server and in
  // the first paint, spilling out of a narrow card; the shell holds the chart's height instead.
  const [measured, setWidth] = useState<number | null>(null)
  const width = measured ?? 0
  const [hover, setHover] = useState<number | null>(null)

  useEffect(() => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(240, Math.round(entry.contentRect.width)))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  const plotWidth = width - PLOT.left - PLOT.right
  const plotHeight = PLOT.height - PLOT.top - PLOT.bottom
  const band = plotWidth / Math.max(1, columns)
  /** The x of a column's centre. */
  const centre = (index: number) => PLOT.left + band * index + band / 2

  // Apart from the geometry, so the geometry is plainly not a ref to the rules of hooks.
  const geometry: ChartGeometry = { ready: measured !== null, width, hover, setHover, plotHeight, band, centre }
  return [measure, geometry] as const
}
