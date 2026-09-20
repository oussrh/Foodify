import type { Route } from 'next'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import EditDishForm, { type EditDishValues } from '@/components/edit-dish-form'
import IngredientManager from '@/components/ingredient-manager'
import DishStatusManager from '@/components/dish-status-manager'
import { PageHeader } from '@/components/shell/page-header'

export default async function EditDishPage({ params }: { params: Promise<{ id: string; dishId: string }> }) {
  const { id, dishId } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/manager/login')

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

  const subcategories = restaurant.categories.flatMap((category) =>
    category.subcategories.map((sub) => ({ id: sub.id, nameEn: `${category.nameEn} → ${sub.nameEn}` })),
  )

  const defaultValues: EditDishValues = {
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn,
    descriptionFr: dish.descriptionFr,
    price: dish.price.toFixed(2),
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
        back={{ href: `/manager/restaurants/${restaurant.id}/dishes` as Route, label: 'All dishes' }}
      />

      <DishStatusManager
        dishId={dish.id}
        isActive={dish.isActive}
        isMostPurchased={dish.isMostPurchased}
      />

      <EditDishForm
        key={`${dish.id}-${dish.imageUrl}-${dish.usdzUrl}-${dish.glbUrl}`}
        id={dish.id}
        defaultValues={defaultValues}
        subcategories={subcategories}
        restaurantName={restaurant.name}
      />

      <IngredientManager dishId={dish.id} ingredients={dish.ingredients} />
    </div>
  )
}
