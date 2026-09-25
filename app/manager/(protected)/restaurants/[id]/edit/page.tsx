import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SettingsScreen } from '@/components/restaurant-form/settings-screen'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'
import { loadPosView } from '@/server/pos/view'

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.email) redirect('/manager/login')
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('manager', code, 'edit'))

  const restaurant = await prisma.restaurant.findFirst({ where: { id, users: { some: { email: session.user.email } } } })
  if (!restaurant) redirect('/manager/restaurants')

  return <SettingsScreen restaurant={restaurant} pos={await loadPosView(restaurant.id)} />
}
