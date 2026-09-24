import type { Route } from 'next'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DishEditor from '@/components/shell/dish-editor'
import { dishSegments, routeParams } from '@/lib/schemas/page-params'

export default async function EditDishPage({ params }: { params: Promise<{ id: string; dishId: string }> }) {
  const session = await auth()
  if (!session?.user?.email) redirect('/manager/login')
  const { id, dishId } = routeParams(dishSegments, await params)

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session.user.email } } },
    include: {
      categories: {
        include: { subcategories: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  if (!restaurant) redirect('/manager/restaurants')

  const dish = await prisma.dish.findFirst({
    where: { id: dishId, restaurantId: restaurant.id },
    include: { ingredients: { orderBy: { nameEn: 'asc' } }, _count: { select: { views: true } } },
  })
  if (!dish) redirect(`/manager/restaurants/${restaurant.id}/dishes` as Route)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <DishEditor portal="manager" restaurant={restaurant} dish={dish} />
    </div>
  )
}
