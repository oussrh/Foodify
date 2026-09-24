import { redirect } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { loadTablesRestaurant } from '@/lib/restaurant-loader'
import { TablesPanel } from '@/components/qr/tables-panel'
import { idSegment, routeParams } from '@/lib/schemas/page-params'

export default async function RestaurantTablesPage({ params }: { params: Promise<{ id: string }> }) {
  const restaurant = await loadTablesRestaurant(routeParams(idSegment, await params).id)
  if (!restaurant) redirect('/manager/restaurants')
  return <TablesPanel restaurant={restaurant} origin={publicEnv.appUrl} />
}
