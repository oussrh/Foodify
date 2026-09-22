import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { boardMetadata } from '@/lib/order-board-page'
import { loadBoardRestaurant } from '@/lib/restaurant-loader'
import BoardScreen from '@/components/orders/board-screen'

/** The tablet installs this one: the manifest names the restaurant and opens straight onto its board. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return boardMetadata((await params).id, 'kitchen')
}

/**
 * The board as the kitchen sees it: no way back into a portal, because a tablet on the pass is
 * not a signed-in manager. A reader who may not open this restaurant is sent to the tablet login.
 */
export default async function KitchenOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const restaurant = await loadBoardRestaurant((await params).id)
  if (!restaurant) redirect('/kitchen/login')
  return <BoardScreen restaurant={restaurant} portal="kitchen" />
}
