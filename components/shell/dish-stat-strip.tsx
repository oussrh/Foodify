import { StatStrip } from '@/components/shell/page-header'
import type { DishListRow } from '@/components/shell/dishes-list'

/** The four figures above a restaurant's dishes: how many, live, AR ready, marked popular. */
export function DishStatStrip({ rows }: { rows: DishListRow[] }) {
  const live = rows.filter((r) => r.isActive).length
  const ar = rows.filter((r) => r.hasAR).length
  const popular = rows.filter((r) => r.isMostPurchased).length
  return (
    <StatStrip
      stats={[
        { label: 'Dishes', value: rows.length },
        { label: 'Live on the menu', value: live },
        { label: 'AR ready', value: ar },
        { label: 'Marked popular', value: popular },
      ]}
    />
  )
}
