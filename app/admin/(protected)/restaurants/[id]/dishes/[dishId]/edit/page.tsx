import Link from 'next/link'
import type { AppPageProps } from '@/types/page'
import prisma from '@/lib/prisma'
import EditDishForm, { EditDishValues } from '@/components/edit-dish-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export default async function EditDishPage({
  params,
}: AppPageProps<{ id: string; dishId: string }>) {
  const dish = await prisma.dish.findUnique({
    where: { id: params.dishId },
  })

  if (!dish || dish.restaurantId !== params.id) {
    return <div className="py-12 text-center text-muted-foreground">Dish not found</div>
  }

  const subcategories = await prisma.menuSubcategory.findMany({
    where: { category: { restaurantId: dish.restaurantId } },
    orderBy: { nameEn: 'asc' },
  })

  const defaultValues: EditDishValues = {
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn,
    descriptionFr: dish.descriptionFr,
    price: Number(dish.price),
    imageUrl: dish.imageUrl,
    usdzUrl: dish.usdzUrl,
    glbUrl: dish.glbUrl,
    subcategoryId: dish.subcategoryId || '',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Edit Dish</h2>
        <Link
          href={`/admin/restaurants/${dish.restaurantId}/dishes`}
          className={buttonVariants({ variant: 'outline' })}
        >
          Back to Dishes
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{dish.nameEn}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditDishForm
            id={dish.id}
            restaurantId={dish.restaurantId}
            defaultValues={defaultValues}
            subcategories={subcategories}
          />
        </CardContent>
      </Card>
    </div>
  )
}
