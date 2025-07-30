import Image from 'next/image'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SimpleARCamera from '@/components/simple-ar-camera'
import { 
  ChefHat, 
  ArrowLeft, 
  Star, 
  Leaf,
  Flame,
  Award,
  Zap,
  Camera
} from 'lucide-react'
import { notFound } from 'next/navigation'
import Link from 'next/link'

async function getDishData(dishId: string, restaurantSlug: string) {
  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: {
      ingredients: true,
      subcategory: {
        include: {
          category: {
            include: {
              restaurant: true
            }
          }
        }
      },
      restaurant: true
    }
  })

  if (!dish || dish.restaurant?.slug !== restaurantSlug) {
    return null
  }

  return dish
}

export default async function DishPage({ 
  params 
}: { 
  params: Promise<{ slug: string; dishId: string }> 
}) {
  const { slug, dishId } = await params
  const dish = await getDishData(dishId, slug)
  
  if (!dish) {
    notFound()
  }

  const restaurant = dish.restaurant
  const locale = restaurant?.defaultLocale || 'en'
  const hasARModel = dish.usdzUrl || dish.glbUrl
  
  // Mock dietary information
  const isVegetarian = dish.nameEn?.toLowerCase().includes('veggie') || dish.nameEn?.toLowerCase().includes('salad')
  const isSpicy = dish.descriptionEn?.toLowerCase().includes('spicy') || dish.descriptionEn?.toLowerCase().includes('hot')
  const isRecommended = dish.isMostPurchased
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href={`/restaurant/${restaurant?.slug}`}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">
                {locale === 'fr' ? dish.nameFr : dish.nameEn}
              </h1>
              <p className="text-white/90 text-sm">
                {restaurant?.name}
                {dish.subcategory && (
                  <span> • {locale === 'fr' ? dish.subcategory.nameFr : dish.subcategory.nameEn}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="relative aspect-square">
                <Image
                  src={dish.imageUrl}
                  alt={locale === 'fr' ? dish.nameFr : dish.nameEn}
                  fill
                  className="object-cover"
                />
                
                {/* Badges overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {dish.isMostPurchased && (
                    <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 shadow-sm">
                      <Star className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  {isRecommended && !dish.isMostPurchased && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 shadow-sm">
                      <Award className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                  {isVegetarian && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 shadow-sm">
                      <Leaf className="h-3 w-3 mr-1" />
                      Vegetarian
                    </Badge>
                  )}
                  {isSpicy && (
                    <Badge className="bg-red-100 text-red-700 border-red-200 shadow-sm">
                      <Flame className="h-3 w-3 mr-1" />
                      Spicy
                    </Badge>
                  )}
                </div>

                {/* AR Badge */}
                {hasARModel && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 shadow-sm animate-pulse">
                      <Camera className="h-3 w-3 mr-1" />
                      AR Available
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* AR Experience Card */}
            {hasARModel && (
              <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Camera className="h-5 w-5" />
                    AR Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-purple-700">
                    See this dish in 3D on your table! Perfect for visualizing portion size and presentation.
                  </p>
                  
                  <SimpleARCamera 
                    dish={dish}
                    restaurantId={restaurant?.id || ''}
                    locale={locale}
                  />
                  
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <p className="text-sm text-purple-800">
                      📱 <strong>Mobile tip:</strong> Point your camera at a flat surface like your table for the best AR experience
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-gray-900">
                  {locale === 'fr' ? dish.nameFr : dish.nameEn}
                </CardTitle>
                <div className="text-4xl font-bold text-green-600">
                  ${Number(dish.price).toFixed(2)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {locale === 'fr' ? dish.descriptionFr : dish.descriptionEn}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Nutrition Info */}
            {dish.calories && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-600" />
                    Nutrition Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-green-800">Calories</span>
                      <span className="text-2xl font-bold text-green-600">{dish.calories} cal</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">Per serving</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ingredients */}
            {dish.ingredients && dish.ingredients.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-gray-600" />
                    Ingredients ({dish.ingredients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {dish.ingredients.map((ingredient: any) => (
                      <Badge 
                        key={ingredient.id} 
                        variant="outline" 
                        className="text-sm hover:bg-gray-50 transition-colors"
                      >
                        {locale === 'fr' ? ingredient.nameFr : ingredient.nameEn}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}