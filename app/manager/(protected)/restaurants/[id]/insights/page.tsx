import { redirect } from 'next/navigation'
import { loadInsights } from '@/lib/insights-loader'
import { parseGrain } from '@/lib/insights'
import { InsightsScreen } from '@/components/insights/insights-screen'

/** The restaurant's report: how the menu is read, how far readers get, and how fast the kitchen turns an order around. */
export default async function RestaurantInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ grain?: string }>
}) {
  const { id } = await params
  const grain = parseGrain((await searchParams).grain)
  const data = await loadInsights(id, grain)
  if (!data) redirect('/manager/restaurants')
  return (
    <InsightsScreen
      restaurantName={data.restaurant.name}
      ordering={data.restaurant.orderingEnabled}
      grain={grain}
      buckets={data.buckets}
      basePath={`/manager/restaurants/${id}/insights`}
    />
  )
}
