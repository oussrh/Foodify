import { notFound } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { loadOrderHistory } from '@/lib/restaurant-loader'
import HistoryScreen from '@/components/orders/history-screen'
import { restaurantPageId } from '@/lib/restaurant-page'
import { portalBoardPath, restaurantPath } from '@/lib/restaurant-paths'

export default async function AdminOrdersTabPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('admin', code, 'orders'))
  const data = await loadOrderHistory(id)
  if (!data) notFound()
  const boardUrl = `${publicEnv.appUrl}${portalBoardPath('admin', data.restaurant.code)}`
  return <HistoryScreen restaurant={data.restaurant} orders={data.orders} boardUrl={boardUrl} />
}
