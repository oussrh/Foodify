import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { DishesScreen } from '@/components/shell/dishes-screen'
import { dishListRow } from '@/components/shell/dish-list-rows'
import { dishListArgs } from '@/lib/dish-list-loader'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'
import { listSearch, type SearchParams } from '@/lib/schemas/page-params'

/** The dishes of a restaurant this manager is assigned to; any other is sent back to the list. */
export default async function DishesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user?.email) redirect('/manager/login')
  const search = listSearch.parse((await searchParams)?.search)
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('manager', code, 'dishes', search && `search=${encodeURIComponent(search)}`))

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session.user.email } } },
    select: { id: true, code: true, name: true, currencySymbol: true },
  })
  if (!restaurant) redirect('/manager/restaurants')

  const dishes = await prisma.dish.findMany(dishListArgs(restaurant.id, search))
  return <DishesScreen portal="manager" restaurant={restaurant} rows={dishes.map(dishListRow)} search={search} />
}
