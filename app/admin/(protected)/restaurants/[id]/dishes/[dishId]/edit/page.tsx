import type { Route } from 'next'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import EditDishForm, { type EditDishValues } from '@/components/edit-dish-form'
import IngredientManager from '@/components/ingredient-manager'
import DishStatusManager from '@/components/dish-status-manager'
import { PageHeader } from '@/components/shell/page-header'
import { AdminDeleteDishButton } from '@/components/admin-delete-dish-button'

export default async function EditDishPage({ params }: { params: Promise<{ id: string; dishId: string }> }) {
  const { id, dishId } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/admin/login')

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
  if (!dish) redirect(`/admin/restaurants/${restaurant.id}/dishes` as Route)

  const subcategories = restaurant.categories.flatMap((category) =>
    category.subcategories.map((sub) => ({ id: sub.id, nameEn: `${category.nameEn} → ${sub.nameEn}` })),
  )

  const defaultValues: EditDishValues = {
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn,
    descriptionFr: dish.descriptionFr,
    price: Number(dish.price),
    imageUrl: dish.imageUrl,
    usdzUrl: dish.usdzUrl || '',
    glbUrl: dish.glbUrl || '',
    subcategoryId: dish.subcategoryId || '',
    calories: dish.calories || undefined,
    isMostPurchased: dish.isMostPurchased || false,
    dietary: dish.dietary ?? [],
    allergens: dish.allergens ?? [],
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={dish.nameEn}
        description={`${dish.nameFr} · ${dish._count.views} view${dish._count.views === 1 ? '' : 's'} so far`}
        back={{ href: `/admin/restaurants/${restaurant.id}/dishes` as Route, label: 'All dishes' }}
      />

      <DishStatusManager
        dishId={dish.id}
        isActive={dish.isActive}
        isMostPurchased={dish.isMostPurchased}
        restaurantId={restaurant.id}
      />

      <EditDishForm
        key={`${dish.id}-${dish.imageUrl}-${dish.usdzUrl}-${dish.glbUrl}`}
        id={dish.id}
        restaurantId={restaurant.id}
        defaultValues={defaultValues}
        subcategories={subcategories}
        restaurantName={restaurant.name}
      />

      <IngredientManager dishId={dish.id} ingredients={dish.ingredients} />

      <section className="mt-6 flex flex-col gap-3 rounded-lg border border-destructive/40 p-5">
        <div>
          <h2 className="text-base font-semibold text-destructive">Delete this dish</h2>
          <p className="mt-1 text-sm text-muted-foreground">Removes it from the menu along with its photo and AR models. This cannot be undone.</p>
        </div>
        <div>
          <AdminDeleteDishButton dishId={dish.id} dishName={dish.nameEn} restaurantId={restaurant.id} />
        </div>
      </section>
    </div>
  )
}
