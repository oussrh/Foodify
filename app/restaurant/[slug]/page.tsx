import Image from 'next/image'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// import ARViewer from '@/components/ar-viewer'
// Remove admin QR components for public view
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
import Link from 'next/link'

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
              
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* Welcome Message */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-4 md:p-6 text-center">
              <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-2">
                Welcome to our menu!
              </h2>
              <p className="text-blue-700">
                Tap any dish to see details and experience it in AR
              </p>
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
                            restaurantSlug={restaurant.slug}
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
                    restaurantSlug={restaurant.slug}
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

function DishCard({ dish, locale, restaurantSlug }: { 
  dish: any, 
  locale: string,
  restaurantSlug: string 
}) {
  const hasARModel = dish.usdzUrl || dish.glbUrl
  
  // Mock dietary information - you can add these fields to your database schema
  const isVegetarian = dish.name?.toLowerCase().includes('veggie') || dish.name?.toLowerCase().includes('salad')
  const isSpicy = dish.description?.toLowerCase().includes('spicy') || dish.description?.toLowerCase().includes('hot')
  
  return (
    <Link href={`/restaurant/${restaurantSlug}/dish/${dish.id}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white shadow-lg hover:-translate-y-1 cursor-pointer">
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
          
          {/* Click indicator overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
          </div>
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
        
        <CardContent className="pt-0">
          {/* Price */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-2xl font-bold text-green-600">
              ${Number(dish.price).toFixed(2)}
            </div>
            
            {hasARModel && (
              <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                <Camera className="h-3 w-3 mr-1" />
                AR Available
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
