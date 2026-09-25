import { redirect } from 'next/navigation'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { publicEnv } from '@/lib/env'
import { loadRestaurantInfo } from '@/lib/restaurant-loader'
import { restaurantLinks } from '@/lib/restaurant-links'
import { RestaurantInfoScreen } from '@/components/shell/restaurant-info-screen'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'

/** The same tab a manager sees; the loader's guard admits a super admin to any restaurant. */
export default async function RestaurantInfoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('admin', code, 'info'))
  const data = await loadRestaurantInfo(id)
  if (!data) redirect('/admin/restaurants')
  return (
    <RestaurantInfoScreen
      restaurantId={data.restaurant.id}
      restaurantName={data.restaurant.name}
      links={restaurantLinks(publicEnv.appUrl, data.restaurant)}
      stats={data.stats}
      tablesHref={restaurantPath('admin', data.restaurant.code, 'tables')}
      tableCount={data.restaurant.tableCount}
    />
  )
}
