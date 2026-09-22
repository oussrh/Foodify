import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { loadKitchenRestaurants } from '@/lib/restaurant-loader'
import RestaurantPicker from '@/components/staff/restaurant-picker'

/** A tablet with one restaurant never sees this: it is sent straight to that board. */
export default async function KitchenHomePage() {
  const restaurants = await loadKitchenRestaurants()
  if (!restaurants) redirect('/kitchen/login')
  if (restaurants.length === 1) redirect(`/kitchen/orders/${restaurants[0]!.id}` as Route)
  return <RestaurantPicker title="Which kitchen?" restaurants={restaurants} basePath="/kitchen/orders" />
}
