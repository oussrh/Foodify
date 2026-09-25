import { redirect } from 'next/navigation'
import { loadKitchenRestaurants } from '@/lib/restaurant-loader'
import { waiterPath } from '@/lib/restaurant-paths'
import RestaurantPicker from '@/components/staff/restaurant-picker'

/** A waiter who works one restaurant is sent straight to its tables. */
export default async function WaiterHomePage() {
  const restaurants = await loadKitchenRestaurants()
  if (!restaurants) redirect('/waiter/login')
  const [only, ...others] = restaurants
  if (only && others.length === 0) redirect(waiterPath(only.code))
  return <RestaurantPicker title="Which restaurant?" restaurants={restaurants} basePath="/waiter" />
}
