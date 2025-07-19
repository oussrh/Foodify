import Image from 'next/image'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ARViewer from '@/components/ar-viewer'
import QRCodeDisplay from '@/components/qr-code-display'
import { 
  ChefHat, 
  Clock, 
  Eye, 
  Star, 
  Utensils,
  Camera,
  Smartphone,
  Globe,
  Phone,
  Mail,
  MapPin,
  Heart
} from 'lucide-react'
import { notFound } from 'next/navigation'

async function getRestaurantData(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          subcategories: {
            include: {
              dishes: {
                where: { isActive: true },
                include: {
                  ingredients: true,
                  views: {
                    select: {
                      id: true,
                      arViewed: true
                    }
                  }
                },
                orderBy: { sortOrder: 'asc' }
              }
            },
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!restaurant) {
    return null
  }

  // Get dishes that don't belong to any subcategory
  const uncategorizedDishes = await prisma.dish.findMany({
    where: {
      restaurantId: restaurant.id,
      subcategoryId: null,
      isActive: true
    },
    include: {
      ingredients: true,
      views: {
        select: {
          id: true,
          arViewed: true
        }
      }
    },
    orderBy: { sortOrder: 'asc' }
  })

  return { restaurant, uncategorizedDishes }
}

export default async function RestaurantPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  const data = await getRestaurantData(slug)
  
  if (!data) {
    notFound()
  }

  const { restaurant, uncategorizedDishes } = data
  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://foodify.app'}/restaurant/${restaurant.slug}`
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Restaurant Header */}
      <div className="relative">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              {/* Restaurant Logo/Image */}
              <div className="flex-shrink-0">
                {restaurant.logoUrl ? (
                  <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden shadow-2xl bg-white p-2">
                    <Image
                      src={restaurant.logoUrl}
                      alt={restaurant.name}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Utensils className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>
              
              {/* Restaurant Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold mb-2">{restaurant.name}</h1>
                  {restaurant.tagline && (
                    <p className="text-xl lg:text-2xl text-white/90 italic">{restaurant.tagline}</p>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-white/90">
                  {restaurant.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{restaurant.email}</span>
                    </div>
                  )}
                </div>
                
                {/* Features */}
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Camera className="h-3 w-3 mr-1" />
                    AR Experience
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Smartphone className="h-3 w-3 mr-1" />
                    Mobile Optimized
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Globe className="h-3 w-3 mr-1" />
                    Digital Menu
                  </Badge>
                </div>
              </div>
              
              {/* QR Code */}
              <div className="flex-shrink-0">
                <QRCodeDisplay url={publicUrl} restaurantName={restaurant.name} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* AR Experience Notice */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Camera className="h-8 w-8 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-900 mb-2">AR Experience Available</h3>
                  <p className="text-amber-700">
                    Tap on dishes with the AR icon to see them in 3D right on your table! 
                    Point your phone camera to visualize the dish before ordering.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Categories */}
          {restaurant.categories.map((category: any) => (
            <div key={category.id} className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {restaurant.defaultLocale === 'fr' ? category.nameFr : category.nameEn}
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
              </div>
              
              {/* Subcategories */}
              {category.subcategories.map((subcategory: any) => (
                <div key={subcategory.id} className="space-y-4">
                  {subcategory.dishes.length > 0 && (
                    <>
                      <h3 className="text-2xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        {restaurant.defaultLocale === 'fr' ? subcategory.nameFr : subcategory.nameEn}
                      </h3>
                      
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {subcategory.dishes.map((dish: any) => (
                          <DishCard 
                            key={dish.id} 
                            dish={dish} 
                            locale={restaurant.defaultLocale}
                            restaurantId={restaurant.id}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
          
          {/* Uncategorized Dishes */}
          {uncategorizedDishes.length > 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Other Dishes</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {uncategorizedDishes.map((dish: any) => (
                  <DishCard 
                    key={dish.id} 
                    dish={dish} 
                    locale={restaurant.defaultLocale}
                    restaurantId={restaurant.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DishCard({ dish, locale, restaurantId }: { 
  dish: any, 
  locale: string,
  restaurantId: string 
}) {
  const hasARModel = dish.usdzUrl || dish.glbUrl
  const viewCount = dish.views?.length || 0
  const arViewCount = dish.views?.filter((v: any) => v.arViewed)?.length || 0
  
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-lg hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={dish.imageUrl}
          alt={locale === 'fr' ? dish.nameFr : dish.nameEn}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* AR Badge */}
        {hasARModel && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-purple-100 text-purple-700 border-purple-200">
              <Camera className="h-3 w-3 mr-1" />
              AR
            </Badge>
          </div>
        )}
        
        {/* Popular Badge */}
        {dish.isMostPurchased && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
              <Star className="h-3 w-3 mr-1" />
              Popular
            </Badge>
          </div>
        )}
        
        {/* View Stats */}
        {viewCount > 0 && (
          <div className="absolute bottom-3 left-3">
            <Badge className="bg-black/20 text-white border-white/20 backdrop-blur-sm">
              <Eye className="h-3 w-3 mr-1" />
              {viewCount}
            </Badge>
          </div>
        )}
      </div>
      
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
            {locale === 'fr' ? dish.nameFr : dish.nameEn}
          </CardTitle>
          <p className="text-gray-600 text-sm line-clamp-2">
            {locale === 'fr' ? dish.descriptionFr : dish.descriptionEn}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Ingredients */}
        {dish.ingredients && dish.ingredients.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Ingredients:</p>
            <div className="flex flex-wrap gap-1">
              {dish.ingredients.slice(0, 4).map((ingredient: any) => (
                <Badge key={ingredient.id} variant="outline" className="text-xs">
                  {locale === 'fr' ? ingredient.nameFr : ingredient.nameEn}
                </Badge>
              ))}
              {dish.ingredients.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{dish.ingredients.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Nutrition Info */}
        {dish.calories && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <ChefHat className="h-4 w-4" />
              <span>{dish.calories} cal</span>
            </div>
          </div>
        )}
        
        {/* Price and AR Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-2xl font-bold text-green-600">
            ${Number(dish.price).toFixed(2)}
          </div>
          
          {hasARModel && (
            <ARViewer 
              dish={dish}
              restaurantId={restaurantId}
              locale={locale}
            />
          )}
        </div>
        
        {/* AR Stats */}
        {hasARModel && arViewCount > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {arViewCount} people viewed this dish in AR
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
