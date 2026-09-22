import { redirect } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { loadRestaurantInfo } from '@/lib/restaurant-loader'
import { restaurantLinks } from '@/lib/restaurant-links'
import { RestaurantInfoScreen } from '@/components/shell/restaurant-info-screen'

/** How much the menu is being opened, the QR code to print, and every address this restaurant hands out. */
export default async function RestaurantInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await loadRestaurantInfo((await params).id)
  if (!data) redirect('/manager/restaurants')
  return (
    <RestaurantInfoScreen
      restaurantId={data.restaurant.id}
      restaurantName={data.restaurant.name}
      links={restaurantLinks(publicEnv.appUrl, data.restaurant)}
      stats={data.stats}
      tablesHref={`/manager/restaurants/${data.restaurant.id}/tables`}
      tableCount={data.restaurant.tableCount}
    />
  )
}
