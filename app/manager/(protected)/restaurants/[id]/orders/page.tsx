import { redirect } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { loadOrderHistory } from '@/lib/restaurant-loader'
import HistoryScreen from '@/components/orders/history-screen'
import { idSegment, routeParams } from '@/lib/schemas/page-params'

export default async function ManagerOrdersTabPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await loadOrderHistory(routeParams(idSegment, await params).id)
  if (!data) redirect('/manager/restaurants')
  const boardUrl = `${publicEnv.appUrl}/manager/orders/${data.restaurant.id}`
  return <HistoryScreen restaurant={data.restaurant} orders={data.orders} boardUrl={boardUrl} />
}
