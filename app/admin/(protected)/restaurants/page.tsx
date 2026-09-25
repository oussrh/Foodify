//PathFile: app/admin/(protected)/restaurants/page.tsx
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shell/page-header'
import RestaurantsList, { restaurantListRow } from '@/components/shell/restaurants-list'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { listSearch, type SearchParams } from '@/lib/schemas/page-params'

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  await requireSuperAdminPage()
  const search = listSearch.parse((await searchParams)?.search)

  const restaurants = await prisma.restaurant.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { slug: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {},
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
        description={`${restaurants.length} restaurant${restaurants.length === 1 ? '' : 's'} on the platform`}
        actions={
          <Button asChild>
            <Link href="/admin/restaurants/create">
              <Plus className="h-4 w-4" />
              Add restaurant
            </Link>
          </Button>
        }
      />
      <RestaurantsList
        portal="admin"
        rows={rows}
        search={search}
        emptyAction={
          <Button asChild>
            <Link href="/admin/restaurants/create">Add restaurant</Link>
          </Button>
        }
      />
    </div>
  )
}
