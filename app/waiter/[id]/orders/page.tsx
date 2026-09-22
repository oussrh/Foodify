import { redirect } from 'next/navigation'
import { loadBoardRestaurant } from '@/lib/restaurant-loader'
import { WaiterOrders } from '@/components/waiter/waiter-orders'

/** Every order on the floor as one list: where to go next, when the grid is not the question. */
export default async function WaiterOrdersPage({ params }: { params: Promise<{ id: string }> }) {
  const restaurant = await loadBoardRestaurant((await params).id)
  if (!restaurant) redirect('/waiter/login')
  return <WaiterOrders restaurant={{ id: restaurant.id, name: restaurant.name }} />
}
