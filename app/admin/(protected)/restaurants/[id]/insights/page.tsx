import { redirect } from 'next/navigation'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { loadInsights } from '@/lib/insights-loader'
import { parseGrain } from '@/lib/insights'
import { InsightsScreen } from '@/components/insights/insights-screen'

/** The same report a manager reads; the loader's guard admits a super admin to any restaurant. */
export default async function RestaurantInsightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ grain?: string }>
}) {
  await requireSuperAdminPage()
  const { id } = await params
  const grain = parseGrain((await searchParams).grain)
  const data = await loadInsights(id, grain)
  if (!data) redirect('/admin/restaurants')
  const { restaurant, ...report } = data
  return (
    <InsightsScreen
      restaurantName={restaurant.name}
      ordering={restaurant.orderingEnabled}
      grain={grain}
      {...report}
      basePath={`/admin/restaurants/${id}/insights`}
    />
  )
}
