import Link from 'next/link'
import type { Route } from 'next'
import prisma from '@/lib/prisma'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shell/page-header'
import DishesList from '@/components/shell/dishes-list'
import { dishListRow } from '@/components/shell/dish-list-rows'
import { DishStatStrip } from '@/components/shell/dish-stat-strip'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DishesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ search?: string }>
}) {
  const { id } = await params
  const sp = searchParams ? await searchParams : undefined
  const search = (sp?.search || '').trim()

  const session = await auth()
  if (!session?.user?.email) redirect('/manager/login')
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session.user.email } } },
    select: { id: true, name: true, currencySymbol: true },
  })
  if (!restaurant) redirect('/manager/restaurants')

  const dishes = await prisma.dish.findMany({
    where: {
      restaurantId: restaurant.id,
      ...(search
        ? {
            OR: [
              { nameEn: { contains: search, mode: 'insensitive' } },
              { nameFr: { contains: search, mode: 'insensitive' } },
              { descriptionEn: { contains: search, mode: 'insensitive' } },
              { descriptionFr: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: { subcategory: { include: { category: true } } },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  const rows = dishes.map(dishListRow)
  const currency = restaurant.currencySymbol || '$'
  const base = `/manager/restaurants/${restaurant.id}`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dishes"
        description={restaurant.name}
        actions={
          <Button asChild>
            <Link href={`${base}/dishes/create` as Route}>
              <Plus className="h-4 w-4" />
              Add dish
            </Link>
          </Button>
        }
      />
      {!search && rows.length > 0 && <DishStatStrip rows={rows} />}
      <DishesList
        portal="manager"
        restaurantId={restaurant.id}
        currency={currency}
        rows={rows}
        search={search}
        emptyAction={
          <Button asChild>
            <Link href={`${base}/dishes/create` as Route}>Add dish</Link>
          </Button>
        }
      />
    </div>
  )
}
