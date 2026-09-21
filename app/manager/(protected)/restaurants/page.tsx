import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { PageHeader } from '@/components/shell/page-header'
import RestaurantsList from '@/components/shell/restaurants-list'

export default async function ManagerRestaurantsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const sp = searchParams ? await searchParams : undefined
  const search = (sp?.search || '').trim()

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

  const rows = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    city: r.city,
    logoUrl: r.logoUrl,
    dishCount: r.dishes.length,
    liveCount: r.dishes.filter((d) => d.isActive).length,
    categoryCount: r._count.categories,
    managerCount: r._count.users,
  }))

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
