import { redirect } from 'next/navigation'
import { loadInsights } from '@/lib/insights-loader'
import { InsightsScreen } from '@/components/insights/insights-screen'
import { grainParam, idSegment, routeParams, type SearchParams } from '@/lib/schemas/page-params'

/** The restaurant's report: how the menu is read, how far readers get, and how fast the kitchen turns an order around. */
export default async function RestaurantInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = routeParams(idSegment, await params)
  const grain = grainParam.parse((await searchParams).grain)
  const data = await loadInsights(id, grain)
  if (!data) redirect('/manager/restaurants')
  const { restaurant, ...report } = data
  return (
    <InsightsScreen
      restaurantName={restaurant.name}
      ordering={restaurant.orderingEnabled}
      grain={grain}
      {...report}
      basePath={`/manager/restaurants/${id}/insights`}
    />
  )
}
