import { redirect } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { loadTablesRestaurant } from '@/lib/restaurant-loader'
import { TablesPanel } from '@/components/qr/tables-panel'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'

export default async function RestaurantTablesPage({ params }: { params: Promise<{ id: string }> }) {
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('manager', code, 'tables'))
  const restaurant = await loadTablesRestaurant(id)
  if (!restaurant) redirect('/manager/restaurants')
  return <TablesPanel restaurant={restaurant} origin={publicEnv.appUrl} />
}
