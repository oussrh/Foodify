// components/insights/insights-screen.tsx
// The Insights tab as both portals show it: the window's totals, then the same figures bucket
// by bucket. The two strips are split because they answer different questions — how many people
// read the menu and how far they got, and how fast the kitchen turned an order around — and a
// restaurant that takes no orders only has the first.
import { PageHeader, StatStrip } from '@/components/shell/page-header'
import { GrainTabs } from '@/components/insights/grain-tabs'
import { InsightsTable } from '@/components/insights/insights-table'
import { conversion, formatDuration, totalsOf, GRAIN_WINDOW, type Grain, type InsightsBucket } from '@/lib/insights'

interface InsightsScreenProps {
  restaurantName: string
  ordering: boolean
  grain: Grain
  buckets: InsightsBucket[]
  /** The tab's own path, for the period links. */
  basePath: string
}

export function InsightsScreen({ restaurantName, ordering, grain, buckets, basePath }: InsightsScreenProps) {
  const totals = totalsOf(buckets)
  const orders = totals.guestOrders + totals.staffOrders
  const toOrder = conversion(orders, totals.views)
  const toCart = conversion(totals.cartAdds, totals.views)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Insights"
        description={`How ${restaurantName} is being read and served over ${GRAIN_WINDOW[grain]}.`}
        actions={<GrainTabs basePath={basePath} current={grain} />}
      />

      <StatStrip
        stats={[
          { label: 'Dishes opened', value: totals.views.toLocaleString() },
          {
            label: 'AR sessions',
            value: totals.arViews.toLocaleString(),
            ...(conversion(totals.arViews, totals.views) !== null
              ? { hint: `${conversion(totals.arViews, totals.views)}% of views` }
              : {}),
          },
          {
            label: 'Added to cart',
            value: ordering ? totals.cartAdds.toLocaleString() : '—',
            ...(ordering && toCart !== null ? { hint: `${toCart}% of views` } : {}),
          },
          {
            label: 'Orders sent',
            value: ordering ? orders.toLocaleString() : '—',
            ...(ordering && toOrder !== null ? { hint: `${toOrder}% of views` } : {}),
          },
        ]}
      />

      {ordering && (
        <StatStrip
          stats={[
            { label: 'Ordered by guests', value: totals.guestOrders.toLocaleString() },
            { label: 'Taken by a waiter', value: totals.staffOrders.toLocaleString() },
            { label: 'Average time to accept', value: formatDuration(totals.acceptSeconds) },
            { label: 'Average time to serve', value: formatDuration(totals.serveSeconds) },
          ]}
        />
      )}

      {!ordering && (
        <p className="text-sm text-muted-foreground">
          This restaurant is not taking orders, so there is nothing to count between reading the menu and being served.
          Turn ordering on in Settings → General and the cart, the orders and the kitchen&apos;s times appear here.
        </p>
      )}

      <InsightsTable buckets={buckets} grain={grain} ordering={ordering} />
    </div>
  )
}
