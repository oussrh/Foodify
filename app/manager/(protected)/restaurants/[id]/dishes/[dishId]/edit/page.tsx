import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getDishDetails } from '@/app/actions/dish-actions'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import EditDishForm from '@/components/edit-dish-form'
import IngredientManager from '@/components/ingredient-manager'
import DishStatusManager from '@/components/dish-status-manager'

export default async function EditDishPage({
  params,
}: {
  params: Promise<{ id: string; dishId: string }>
}) {
  const { id: restaurantId, dishId } = await params
  const session = await auth()
  
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }

  // Verify restaurant access
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, users: { some: { email: session.user.email } } },
    include: {
      categories: {
        include: {
          subcategories: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  // Get dish details
  const dish = await getDishDetails(dishId)
  if (!dish || dish.restaurantId !== restaurantId) {
    redirect(`/manager/restaurants/${restaurantId}/dishes`)
  }

  // Flatten subcategories for the form
  const subcategories = restaurant.categories.flatMap(category => 
    category.subcategories.map(sub => ({
      id: sub.id,
      nameEn: `${category.nameEn} → ${sub.nameEn}`
    }))
  )

  // Prepare default values for the form
  const defaultValues = {
    nameEn: dish.nameEn,
    nameFr: dish.nameFr,
    descriptionEn: dish.descriptionEn || '',
    descriptionFr: dish.descriptionFr || '',
    price: Number(dish.price),
    imageUrl: dish.imageUrl,
    usdzUrl: dish.usdzUrl,
    glbUrl: dish.glbUrl,
    subcategoryId: dish.subcategoryId || undefined,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/manager/restaurants/${restaurantId}/dishes` as any}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dishes
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Dish</h1>
          <p className="text-muted-foreground">
            {dish.nameEn} • {restaurant.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Basic Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <EditDishForm 
                id={dishId}
                restaurantId={restaurantId}
                defaultValues={defaultValues}
                subcategories={subcategories}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <DishStatusManager 
                dishId={dishId}
                isActive={dish.isActive}
                isMostPurchased={dish.isMostPurchased}
                calories={dish.calories}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Ingredients & Analytics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <IngredientManager 
                dishId={dishId}
                ingredients={dish.ingredients}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{dish._count.views}</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">${Number(dish.price)}</div>
                  <div className="text-sm text-muted-foreground">Current Price</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Category:</span>
                  <span className="font-medium">
                    {dish.subcategory ? 
                      `${dish.subcategory.category.nameEn} → ${dish.subcategory.nameEn}` : 
                      'No category'
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className={`font-medium ${dish.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {dish.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Popular:</span>
                  <span className="font-medium">
                    {dish.isMostPurchased ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}