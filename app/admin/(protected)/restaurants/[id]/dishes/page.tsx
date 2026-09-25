import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { DishesScreen } from '@/components/shell/dishes-screen'
import { dishListRow } from '@/components/shell/dish-list-rows'
import { dishListArgs } from '@/lib/dish-list-loader'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'
import { listSearch, type SearchParams } from '@/lib/schemas/page-params'

/** Any restaurant's dishes, for a super admin; an unknown restaurant is a 404. */
export default async function DishesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<SearchParams>
}) {
  await requireSuperAdminPage()
  const search = listSearch.parse((await searchParams)?.search)
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('admin', code, 'dishes', search && `search=${encodeURIComponent(search)}`))

  const restaurant = await prisma.restaurant.findUnique({ where: { id }, select: { id: true, code: true, name: true, currencySymbol: true } })
  if (!restaurant) notFound()

  const dishes = await prisma.dish.findMany(dishListArgs(restaurant.id, search))
  return <DishesScreen portal="admin" restaurant={restaurant} rows={dishes.map(dishListRow)} search={search} />
}
