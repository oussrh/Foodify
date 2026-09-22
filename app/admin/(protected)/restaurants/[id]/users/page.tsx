import { notFound } from 'next/navigation'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { publicEnv } from '@/lib/env'
import { loadRestaurantPeople } from '@/lib/restaurant-loader'
import PeoplePanel from '@/components/admin/people-panel'

/** The same tab a manager sees, plus the links out to each account's platform-wide page. */
export default async function AdminRestaurantPeoplePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuperAdminPage()
  const { id } = await params
  const restaurant = await loadRestaurantPeople(id)
  if (!restaurant) notFound()
  return <PeoplePanel restaurant={restaurant} origin={publicEnv.appUrl} currentUserId={me.id} isSuperAdmin />
}
