import { notFound } from 'next/navigation'
import { publicEnv } from '@/lib/env'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { loadOrderHistory } from '@/lib/restaurant-loader'
import HistoryScreen from '@/components/orders/history-screen'
import { idSegment, routeParams } from '@/lib/schemas/page-params'

export default async function AdminOrdersTabPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const { id } = routeParams(idSegment, await params)
  const data = await loadOrderHistory(id)
  if (!data) notFound()
  const boardUrl = `${publicEnv.appUrl}/admin/orders/${data.restaurant.id}`
  return <HistoryScreen restaurant={data.restaurant} orders={data.orders} boardUrl={boardUrl} />
}
