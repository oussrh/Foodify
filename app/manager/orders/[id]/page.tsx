import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { boardMetadata } from '@/lib/order-board-page'
import { loadBoardRestaurant } from '@/lib/restaurant-loader'
import BoardScreen from '@/components/orders/board-screen'
import { idSegment, routeParams } from '@/lib/schemas/page-params'

/** The board is installable on the tablet: the manifest names the restaurant and opens straight onto its board. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return boardMetadata((await params).id, 'manager')
}

/** The kitchen board, outside the portal shell: a tablet shows orders, not a rail and a tab strip. */
export default async function ManagerOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const restaurant = await loadBoardRestaurant(routeParams(idSegment, await params).id)
  if (!restaurant) redirect('/manager/login')
  return <BoardScreen restaurant={restaurant} portal="manager" />
}
