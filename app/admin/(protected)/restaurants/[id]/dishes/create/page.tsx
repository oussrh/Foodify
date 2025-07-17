import Link from 'next/link'
type PageProps = {
  params: { id: string }
}
import prisma from '@/lib/prisma'
import CreateDishForm from '@/components/create-dish-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export default async function CreateDishPage({ params }: PageProps) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: params.id } })
  if (!restaurant) {
    return <div className="py-12 text-center text-muted-foreground">Restaurant not found</div>
  }
  const subcategories = await prisma.menuSubcategory.findMany({
    where: { category: { restaurantId: restaurant.id } },
    orderBy: { nameEn: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Create Dish</h2>
        <Link
          href={`/admin/restaurants/${restaurant.id}/dishes`}
          className={buttonVariants({ variant: 'outline' })}
        >
          Back to Dishes
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New Dish Details</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateDishForm restaurantId={restaurant.id} subcategories={subcategories} />
        </CardContent>
      </Card>
    </div>
  )
}
