import Image from 'next/image'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ARViewer from '@/components/ar-viewer'
import SimpleQRDisplay from '@/components/simple-qr-display'
import FloatingQRButton from '@/components/floating-qr-button'
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
  Heart,
  Leaf,
  Flame,
  Award,
  Zap,
  Users
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
                
                {/* QR Code Access Button */}
                <div className="pt-4">
                  <SimpleQRDisplay url={publicUrl} restaurantName={restaurant.name} />
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* AR Experience Notice - Mobile Optimized */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-indigo-50 md:from-amber-50 md:to-orange-50">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="p-3 bg-purple-100 md:bg-amber-100 rounded-full flex-shrink-0">
                  <Camera className="h-6 w-6 md:h-8 md:w-8 text-purple-600 md:text-amber-600" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg md:text-xl font-bold text-purple-900 md:text-amber-900">
                    🚀 AR Menu Experience
                  </h3>
                  <p className="text-sm md:text-base text-purple-700 md:text-amber-700 leading-relaxed">
                    Tap the <span className="inline-flex items-center gap-1 bg-purple-100 md:bg-amber-100 px-2 py-1 rounded text-xs font-medium">
                      <Camera className="h-3 w-3" /> AR
                    </span> button on dishes to see them in 3D on your table! Perfect for visualizing portion sizes and presentation.
                  </p>
                  
                  {/* Mobile-specific instructions */}
                  <div className="md:hidden pt-2 border-t border-purple-200">
                    <p className="text-xs text-purple-600">
                      📱 <strong>Mobile Tip:</strong> Works best with your phone's camera pointing at a flat surface like your table
                    </p>
                  </div>
                </div>
                
                {/* QR Code Access for Desktop */}
                <div className="hidden md:block flex-shrink-0">
                  <div className="text-center space-y-2">
                    <p className="text-xs text-amber-700 font-medium">Share with customers:</p>
                    <SimpleQRDisplay url={publicUrl} restaurantName={restaurant.name} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Categories */}
          {restaurant.categories.map((category: any) => (
            <div key={category.id} className="space-y-6">
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  {restaurant.defaultLocale === 'fr' ? category.nameFr : category.nameEn}
                </h2>
                <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
              </div>
              
              {/* Subcategories */}
              {category.subcategories.map((subcategory: any) => (
                <div key={subcategory.id} className="space-y-4">
                  {subcategory.dishes.length > 0 && (
                    <>
                      <h3 className="text-xl md:text-2xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        {restaurant.defaultLocale === 'fr' ? subcategory.nameFr : subcategory.nameEn}
                      </h3>
                      
                      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div className="text-center space-y-3">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Other Dishes</h2>
                <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
              </div>
              
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
      
      {/* Floating QR Code Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <FloatingQRButton url={publicUrl} restaurantName={restaurant.name} />
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
  
  // Mock dietary information - you can add these fields to your database schema
  const isVegetarian = dish.name?.toLowerCase().includes('veggie') || dish.name?.toLowerCase().includes('salad')
  const isSpicy = dish.description?.toLowerCase().includes('spicy') || dish.description?.toLowerCase().includes('hot')
  const isRecommended = dish.isMostPurchased || Math.random() > 0.7 // You can implement actual recommendation logic
  
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-lg hover:-translate-y-1">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={dish.imageUrl}
          alt={locale === 'fr' ? dish.nameFr : dish.nameEn}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
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
              Veggie
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
          <div className="absolute top-3 right-3">
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 shadow-sm animate-pulse">
              <Camera className="h-3 w-3 mr-1" />
              AR
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
        
        {/* AR indicator overlay for mobile */}
        {hasARModel && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <Camera className="h-6 w-6 text-purple-600" />
            </div>
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
        {/* Nutrition Info Bar */}
        {dish.calories && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Zap className="h-4 w-4" />
                <span>Nutrition</span>
              </div>
              <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                {dish.calories} <span className="text-sm font-normal">cal</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Ingredients */}
        {dish.ingredients && dish.ingredients.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-gray-600" />
              <p className="text-sm font-medium text-gray-700">Ingredients</p>
              <span className="text-xs text-gray-500">({dish.ingredients.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {dish.ingredients.slice(0, 6).map((ingredient: any) => (
                <Badge key={ingredient.id} variant="outline" className="text-xs hover:bg-gray-50 transition-colors">
                  {locale === 'fr' ? ingredient.nameFr : ingredient.nameEn}
                </Badge>
              ))}
              {dish.ingredients.length > 6 && (
                <Badge variant="outline" className="text-xs bg-gray-100">
                  +{dish.ingredients.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Price and Action Row */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="space-y-1">
            <div className="text-3xl font-bold text-green-600">
              ${Number(dish.price).toFixed(2)}
            </div>
            {dish.calories && (
              <p className="text-xs text-gray-500">Per serving</p>
            )}
          </div>
          
          {hasARModel && (
            <div className="flex flex-col items-end gap-2">
              <ARViewer 
                dish={dish}
                restaurantId={restaurantId}
                locale={locale}
              />
              <p className="text-xs text-purple-600 font-medium">
                📱 Tap to see on your table
              </p>
            </div>
          )}
        </div>
        
        {/* AR Experience Stats */}
        {hasARModel && (
          <div className="pt-3 border-t border-gray-100 bg-purple-50 -mx-6 -mb-6 p-4 mt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-purple-700">
                <Camera className="h-4 w-4" />
                <span className="font-medium">AR Experience Available</span>
              </div>
              {arViewCount > 0 && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Users className="h-3 w-3" />
                  <span className="text-xs">{arViewCount} AR views</span>
                </div>
              )}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              View this dish in 3D on your table before ordering
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
