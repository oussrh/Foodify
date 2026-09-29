import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/shell/page-header'
import RestaurantsList, { restaurantListRow } from '@/components/shell/restaurants-list'
import { listSearch, type SearchParams } from '@/lib/schemas/page-params'

export default async function ManagerRestaurantsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const search = listSearch.parse((await searchParams)?.search)

  const restaurants = await prisma.restaurant.findMany({
    where: {
      users: { some: { email: session.user.email } },
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    include: {
      dishes: { select: { isActive: true } },
      _count: { select: { categories: true, users: true } },
    },
  })

  const rows = restaurants.map(restaurantListRow)

  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        title="Restaurants"
        description={restaurants.length === 1 ? 'The restaurant you manage' : `${restaurants.length} restaurants you manage`}
      />
      <RestaurantsList portal="manager" rows={rows} search={search} />
    </div>
  )
}
