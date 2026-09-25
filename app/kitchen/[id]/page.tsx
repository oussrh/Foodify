import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { boardMetadata } from '@/lib/order-board-page'
import { loadBoardRestaurant, restaurantIdFromParam } from '@/lib/restaurant-loader'
import { isKitchenWord } from '@/lib/restaurant-paths'
import BoardScreen from '@/components/orders/board-screen'

/** The tablet installs this one: the manifest names the restaurant and opens straight onto its board. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return boardMetadata((await params).id, 'kitchen')
}

/**
 * The board as the kitchen sees it, at `/kitchen/<code>`: the restaurant first, then the screen,
 * as the waiter's app is laid out. No way back into a portal, because a tablet on the pass is not
 * a signed-in manager. A reader who may not open this restaurant is sent to the tablet login.
 * `/kitchen/orders/<code>`, the address tablets installed before, serves this same page (a rewrite
 * in next.config.js, so an installed tablet stays inside its scope). The static `/kitchen/login`
 * is matched before this dynamic segment, and the kitchen's other words are a 404 here.
 */
export default async function KitchenOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: param } = await params
  if (isKitchenWord(param)) notFound()
  const id = await restaurantIdFromParam(param) ?? notFound()
  const restaurant = await loadBoardRestaurant(id)
  if (!restaurant) redirect('/kitchen/login')
  return <BoardScreen restaurant={restaurant} portal="kitchen" />
}
