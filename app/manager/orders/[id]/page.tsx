import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { boardMetadata } from '@/lib/order-board-page'
import { loadBoardRestaurant, restaurantIdFromParam } from '@/lib/restaurant-loader'
import BoardScreen from '@/components/orders/board-screen'

/** The board is installable on the tablet: the manifest names the restaurant and opens straight onto its board. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return boardMetadata((await params).id, 'manager')
}

/**
 * The kitchen board, outside the portal shell: a tablet shows orders, not a rail and a tab strip.
 * Addressed by the restaurant's code; a uuid still opens it, unredirected, because a board
 * installed from it keeps that address as its scope and a redirect would take it outside.
 */
export default async function ManagerOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const id = await restaurantIdFromParam((await params).id) ?? notFound()
  const restaurant = await loadBoardRestaurant(id)
  if (!restaurant) redirect('/manager/login')
  return <BoardScreen restaurant={restaurant} portal="manager" />
}
