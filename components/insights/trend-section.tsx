// components/insights/trend-section.tsx
// The report over time: how many dishes were opened (and how many of those in AR), and — for a
// restaurant that takes orders — how many orders came in, from whom, and what they came to.
// Revenue has its own chart: money and counts on one axis would make one of them unreadable.
import { GRAIN_LABEL, type Grain, type InsightsBucket } from '@/lib/insights'
import type { Money } from '@/lib/menu'
import { ChartCard } from '@/components/insights/charts/chart-card'
import { ColumnChart } from '@/components/insights/charts/column-chart'
import { ordersChart, revenueChart, trafficChart } from '@/components/insights/insights-series'

interface TrendSectionProps {
  buckets: InsightsBucket[]
  grain: Grain
  ordering: boolean
  money: Money
}

export function TrendSection({ buckets, grain, ordering, money }: TrendSectionProps) {
  const per = GRAIN_LABEL[grain].toLowerCase()
  const traffic = trafficChart(buckets, grain)
  const orders = ordersChart(buckets, grain)
  const revenue = revenueChart(buckets, grain, money)
  const currency = money.code ?? money.symbol

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard
        title="Dishes opened"
        description={`${GRAIN_LABEL[grain]} opens of a dish on the public menu, and how many went on to AR.`}
        legend={traffic.series.map((s) => ({ label: s.label, slot: s.slot }))}
      >
        <ColumnChart {...traffic} label={`Dishes opened, ${per}`} />
      </ChartCard>
      {ordering && (
        <ChartCard
          title="Orders"
          description="Sent from a guest's phone, or taken by a waiter at the table."
          legend={orders.series.map((s) => ({ label: s.label, slot: s.slot }))}
        >
          <ColumnChart {...orders} label={`Orders, ${per}`} />
        </ChartCard>
      )}
      {ordering && (
        <ChartCard
          title="Revenue"
          description={`What the orders came to, cancelled ones left out, in ${currency}.`}
          className="lg:col-span-2"
        >
          <ColumnChart {...revenue} label={`Revenue, ${per}`} />
        </ChartCard>
      )}
    </div>
  )
}
