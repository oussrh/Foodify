import { redirect } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { loadRestaurantInfo } from '@/lib/restaurant-loader'
import { restaurantLinks } from '@/lib/restaurant-links'
import { RestaurantInfoScreen } from '@/components/shell/restaurant-info-screen'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'

/** How much the menu is being opened, the QR code to print, and every address this restaurant hands out. */
export default async function RestaurantInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('manager', code, 'info'))
  const data = await loadRestaurantInfo(id)
  if (!data) redirect('/manager/restaurants')
  return (
    <RestaurantInfoScreen
      restaurantId={data.restaurant.id}
      restaurantName={data.restaurant.name}
      links={restaurantLinks(publicEnv.appUrl, data.restaurant)}
      stats={data.stats}
      tablesHref={restaurantPath('manager', data.restaurant.code, 'tables')}
      tableCount={data.restaurant.tableCount}
    />
  )
}
