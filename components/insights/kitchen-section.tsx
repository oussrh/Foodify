// components/insights/kitchen-section.tsx
// How fast an order is turned round, over time: the three waits a table sits through, each an
// average of the orders that reached it. On one axis, because they are the same unit and a
// reader compares them — the prepare line under the serve line is the floor's share of the wait.
import type { Grain, InsightsBucket } from '@/lib/insights'
import { ChartCard } from '@/components/insights/charts/chart-card'
import { LineChart } from '@/components/insights/charts/line-chart'
import { kitchenChart } from '@/components/insights/insights-series'

/** The three waits a table sits through (to accept, to prepare, to serve) as lines over time. */
export function KitchenSection({ buckets, grain }: { buckets: InsightsBucket[]; grain: Grain }) {
  const chart = kitchenChart(buckets, grain)
  return (
    <ChartCard
      title="Waiting times"
      description="Average minutes from the order arriving to being accepted and to reaching the table; preparing counts from acceptance to being called up."
      legend={chart.series.map((s) => ({ label: s.label, slot: s.slot, line: true }))}
    >
      <LineChart {...chart} label="Average waiting times in minutes" unit=" min" />
    </ChartCard>
  )
}
