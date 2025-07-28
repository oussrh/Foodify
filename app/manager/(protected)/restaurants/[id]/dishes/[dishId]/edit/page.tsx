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
import { ArrowLeft, Utensils, Settings, ChefHat, BarChart3 } from 'lucide-react'
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
    calories: dish.calories || undefined,
    isMostPurchased: dish.isMostPurchased || false,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild className="hover:bg-orange-50">
            <Link href={`/manager/restaurants/${restaurantId}/dishes` as any}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dishes
            </Link>
          </Button>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl">
            <Utensils className="h-8 w-8 text-orange-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Edit Dish</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">{dish.nameEn}</span>
              <span>•</span>
              <span>{restaurant.name}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Manage all aspects of your dish including visibility, ingredients, and pricing
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Basic Info */}
        <div className="xl:col-span-2 space-y-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Utensils className="h-5 w-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <EditDishForm 
                key={`${dish.id}-${dish.imageUrl}-${dish.usdzUrl}-${dish.glbUrl}`}
                id={dishId}
                restaurantId={restaurantId}
                defaultValues={defaultValues}
                subcategories={subcategories}
                restaurantName={restaurant.name}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-purple-600" />
                Status & Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <DishStatusManager 
                dishId={dishId}
                isActive={dish.isActive}
                isMostPurchased={dish.isMostPurchased}
                calories={dish.calories}
                restaurantId={restaurantId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Ingredients & Analytics */}
        <div className="space-y-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ChefHat className="h-5 w-5 text-orange-600" />
                Ingredients
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <IngredientManager 
                dishId={dishId}
                ingredients={dish.ingredients}
              />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Analytics & Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-700">{dish._count.views}</div>
                  <div className="text-sm text-blue-600 font-medium">Total Views</div>
                  <div className="text-xs text-blue-500 mt-1">Customer interest metric</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-700">${Number(dish.price).toFixed(2)}</div>
                  <div className="text-sm text-green-600 font-medium">Current Price</div>
                  <div className="text-xs text-green-500 mt-1">USD per dish</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 border-b pb-2">Dish Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Category</span>
                    <span className="text-sm font-medium text-gray-900">
                      {dish.subcategory ? 
                        `${dish.subcategory.category.nameEn} → ${dish.subcategory.nameEn}` : 
                        'No category'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Visibility</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${dish.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {dish.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Popular Status</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${dish.isMostPurchased ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {dish.isMostPurchased ? 'Popular' : 'Regular'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Ingredients</span>
                    <span className="text-sm font-medium text-gray-900">
                      {dish.ingredients.length} ingredient{dish.ingredients.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}