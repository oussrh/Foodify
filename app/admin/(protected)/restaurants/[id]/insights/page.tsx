import { redirect } from 'next/navigation'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { loadInsights } from '@/lib/insights-loader'
import { InsightsScreen } from '@/components/insights/insights-screen'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'
import { grainParam, type SearchParams } from '@/lib/schemas/page-params'

/** The same report a manager reads; the loader's guard admits a super admin to any restaurant. */
export default async function RestaurantInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  await requireSuperAdminPage()
  const grain = grainParam.parse((await searchParams).grain)
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('admin', code, 'insights', `grain=${grain}`))
  const data = await loadInsights(id, grain)
  if (!data) redirect('/admin/restaurants')
  const { restaurant, ...report } = data
  return (
    <InsightsScreen
      restaurantName={restaurant.name}
      ordering={restaurant.orderingEnabled}
      grain={grain}
      {...report}
      basePath={restaurantPath('admin', restaurant.code, 'insights')}
    />
  )
}
