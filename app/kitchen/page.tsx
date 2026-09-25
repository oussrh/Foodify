import { redirect } from 'next/navigation'
import { loadKitchenRestaurants } from '@/lib/restaurant-loader'
import { kitchenBoardPath } from '@/lib/restaurant-paths'
import RestaurantPicker from '@/components/staff/restaurant-picker'

/** A tablet with one restaurant never sees this: it is sent straight to that board. */
export default async function KitchenHomePage() {
  const restaurants = await loadKitchenRestaurants()
  if (!restaurants) redirect('/kitchen/login')
  const [only, ...others] = restaurants
  if (only && others.length === 0) redirect(kitchenBoardPath(only.code))
  return <RestaurantPicker title="Which kitchen?" restaurants={restaurants} basePath="/kitchen" />
}
