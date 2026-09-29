import { redirect } from 'next/navigation'
import { loadInsights } from '@/lib/insights-loader'
import { InsightsScreen } from '@/components/insights/insights-screen'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'
import { grainParam, type SearchParams } from '@/lib/schemas/page-params'

/** The restaurant's report: how the menu is read, how far readers get, and how fast the kitchen turns an order around. */
export default async function RestaurantInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const grain = grainParam.parse((await searchParams).grain)
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('manager', code, 'insights', `grain=${grain}`))
  const data = await loadInsights(id, grain)
  if (!data) redirect('/manager/restaurants')
  const { restaurant, ...report } = data
  return (
    <InsightsScreen
      restaurantName={restaurant.name}
      ordering={restaurant.orderingEnabled}
      grain={grain}
      {...report}
      basePath={restaurantPath('manager', restaurant.code, 'insights')}
    />
  )
}
