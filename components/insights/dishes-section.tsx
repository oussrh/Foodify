// components/insights/dishes-section.tsx
// The menu dish by dish: how far guests get from opening a dish to ordering (the funnel), which
// dishes are opened and ordered most, and which are opened and then passed over — the list a
// manager can act on with a better photo, a price or a description.
import { conversion, type InsightsTotals } from '@/lib/insights'
import { overlooked, perOpen, topBy, type DishStat } from '@/lib/insights-dishes'
import { formatMinor } from '@/lib/insights-scores'
import type { Money } from '@/lib/menu'
import { BarList, type BarRow } from '@/components/insights/charts/bar-list'
import { ChartCard } from '@/components/insights/charts/chart-card'

const count = (n: number) => n.toLocaleString('en-GB')

/** Each step with how many of it there were per dish opened; a guest adds more than once per open. */
function funnelRows(totals: InsightsTotals): BarRow[] {
  const step = (key: string, label: string, value: number, note: string | null): BarRow => ({
    key,
    label,
    value,
    display: count(value),
    ...(note ? { note } : {}),
  })
  const share = conversion(totals.guestOrders, totals.views)
  return [
    step('views', 'Dishes opened', totals.views, null),
    step('carts', 'Added to a cart', totals.cartAdds, perOpen(totals.cartAdds, totals.views)),
    step('orders', 'Orders sent by guests', totals.guestOrders, share === null ? null : `${share}% of dishes opened`),
  ]
}

const opensAndOrders = (dish: DishStat) => `${count(dish.views)} opens · ${count(dish.ordered)} ordered`

interface DishesSectionProps {
  totals: InsightsTotals
  dishes: DishStat[]
  ordering: boolean
  money: Money
}

/**
 * The menu dish by dish: the funnel from opening to ordering, the most opened and most ordered, and
 * the dishes opened but rarely ordered.
 */
export function DishesSection({ totals, dishes, ordering, money }: DishesSectionProps) {
  const opened = topBy(dishes, (d) => d.views).map((d) => ({
    key: d.id,
    label: d.name,
    value: d.views,
    display: count(d.views),
    note: `${count(d.arViews)} in AR${ordering ? ` · ${count(d.ordered)} ordered` : ''}`,
  }))
  const ordered = topBy(dishes, (d) => d.ordered).map((d) => ({
    key: d.id,
    label: d.name,
    value: d.ordered,
    display: count(d.ordered),
    note: formatMinor(d.revenueMinor, money),
  }))
  const passedOver = overlooked(dishes).map((d) => ({ key: d.id, label: d.name, value: d.views, display: count(d.views), note: opensAndOrders(d) }))

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {ordering && (
        <ChartCard title="From menu to order" description="How far guests get, out of every dish opened.">
          <BarList rows={funnelRows(totals)} empty="Nobody has opened a dish yet." />
        </ChartCard>
      )}
      <ChartCard title="Most opened" description="The dishes guests look at most.">
        <BarList rows={opened} empty="No dish has been opened in this period." />
      </ChartCard>
      {ordering && (
        <ChartCard title="Most ordered" description="Portions ordered, with what they came to.">
          <BarList rows={ordered} slot={2} empty="Nothing has been ordered in this period." />
        </ChartCard>
      )}
      {ordering && (
        <ChartCard
          title="Opened, rarely ordered"
          description="Well looked at, ordered at under half the menu's rate: worth a new photo, price or description."
        >
          <BarList rows={passedOver} slot={3} empty="No dish stands out: the ones guests open, they order." />
        </ChartCard>
      )}
    </div>
  )
}
