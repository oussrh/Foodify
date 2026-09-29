import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { boardMetadata } from '@/lib/order-board-page'
import { loadBoardRestaurant, restaurantIdFromParam } from '@/lib/restaurant-loader'
import BoardScreen from '@/components/orders/board-screen'

/** Same board, same manifest, named for the admin portal so an installed tile opens the right one. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return boardMetadata((await params).id, 'admin')
}

/**
 * A super admin watches any restaurant's board, by its code or (for a board installed before
 * codes) its uuid, unredirected; an unknown one is a 404 here rather than a redirect.
 */
export default async function AdminOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const id = await restaurantIdFromParam((await params).id) ?? notFound()
  const restaurant = await loadBoardRestaurant(id)
  if (!restaurant) notFound()
  return <BoardScreen restaurant={restaurant} portal="admin" />
}
