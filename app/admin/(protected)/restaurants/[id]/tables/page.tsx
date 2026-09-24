import { notFound } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { loadTablesRestaurant } from '@/lib/restaurant-loader'
import { TablesPanel } from '@/components/qr/tables-panel'
import { idSegment, routeParams } from '@/lib/schemas/page-params'

export default async function AdminRestaurantTablesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const restaurant = await loadTablesRestaurant(routeParams(idSegment, await params).id)
  if (!restaurant) notFound()
  return <TablesPanel restaurant={restaurant} origin={publicEnv.appUrl} />
}
