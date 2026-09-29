import { redirect } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { loadOrderHistory } from '@/lib/restaurant-loader'
import HistoryScreen from '@/components/orders/history-screen'
import { restaurantPageId } from '@/lib/restaurant-page'
import { portalBoardPath, restaurantPath } from '@/lib/restaurant-paths'

export default async function ManagerOrdersTabPage({ params }: { params: Promise<{ id: string }> }) {
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('manager', code, 'orders'))
  const data = await loadOrderHistory(id)
  if (!data) redirect('/manager/restaurants')
  const boardUrl = `${publicEnv.appUrl}${portalBoardPath('manager', data.restaurant.code)}`
  return <HistoryScreen restaurant={data.restaurant} orders={data.orders} boardUrl={boardUrl} />
}
