import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DishEditor from '@/components/shell/dish-editor'
import { AdminDeleteDishButton } from '@/components/admin-delete-dish-button'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'
import { dishSegments, routeParams } from '@/lib/schemas/page-params'

export default async function EditDishPage({ params }: { params: Promise<{ id: string; dishId: string }> }) {
  await requireSuperAdminPage()
  const segments = await params
  const { dishId } = routeParams(dishSegments, segments)
  const id = await restaurantPageId(segments.id, (code) => restaurantPath('admin', code, `dishes/${dishId}/edit`))

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      categories: {
        include: { subcategories: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
  if (!restaurant) redirect('/admin/restaurants')

  const dish = await prisma.dish.findFirst({
    where: { id: dishId, restaurantId: restaurant.id },
    include: { ingredients: { orderBy: { nameEn: 'asc' } }, _count: { select: { views: true } } },
  })
  if (!dish) redirect(restaurantPath('admin', restaurant.code, 'dishes'))

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <DishEditor portal="admin" restaurant={restaurant} dish={dish} />

      <section className="mt-6 flex flex-col gap-3 rounded-lg border border-destructive/40 p-5">
        <div>
          <h2 className="text-base font-semibold text-destructive">Delete this dish</h2>
          <p className="mt-1 text-sm text-muted-foreground">Removes it from the menu along with its photo and AR models. This cannot be undone.</p>
        </div>
        <div>
          <AdminDeleteDishButton dishId={dish.id} dishName={dish.nameEn} restaurantCode={restaurant.code} />
        </div>
      </section>
    </div>
  )
}
