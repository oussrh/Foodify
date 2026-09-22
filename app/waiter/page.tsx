import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { loadKitchenRestaurants } from '@/lib/restaurant-loader'
import RestaurantPicker from '@/components/staff/restaurant-picker'

/** A waiter who works one restaurant is sent straight to its tables. */
export default async function WaiterHomePage() {
  const restaurants = await loadKitchenRestaurants()
  if (!restaurants) redirect('/waiter/login')
  if (restaurants.length === 1) redirect(`/waiter/${restaurants[0]!.id}` as Route)
  return <RestaurantPicker title="Which restaurant?" restaurants={restaurants} basePath="/waiter" />
}
