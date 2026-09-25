import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth-guard'
import { publicEnv } from '@/lib/env'
import { loadRestaurantPeople } from '@/lib/restaurant-loader'
import PeoplePanel from '@/components/admin/people-panel'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'

/**
 * A restaurant runs its own people: its managers, the order tablets on the pass and the waiters on
 * the floor. The loader answers null for a restaurant that is not this reader's to manage.
 */
export default async function ManagerRestaurantPeoplePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser()
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('manager', code, 'users'))
  const restaurant = await loadRestaurantPeople(id)
  if (!restaurant) redirect('/manager/restaurants')
  return <PeoplePanel restaurant={restaurant} origin={publicEnv.appUrl} currentUserId={me.id} isSuperAdmin={false} />
}
