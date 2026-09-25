import { notFound } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { loadTablesRestaurant } from '@/lib/restaurant-loader'
import { TablesPanel } from '@/components/qr/tables-panel'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'

export default async function AdminRestaurantTablesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('admin', code, 'tables'))
  const restaurant = await loadTablesRestaurant(id)
  if (!restaurant) notFound()
  return <TablesPanel restaurant={restaurant} origin={publicEnv.appUrl} />
}
