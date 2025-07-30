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
  
  // Apply custom styling
  const customStyles = {
    fontFamily: restaurant.fontFamily || 'Inter, system-ui, sans-serif',
    ...(restaurant.googleFontUrl && {
      '--restaurant-font': restaurant.fontFamily || 'Inter'
    })
  } as React.CSSProperties

  const coverImageStyle = restaurant.coverImageUrl ? {
    backgroundImage: `url(${restaurant.coverImageUrl})`,
    backgroundSize: restaurant.coverImageStyle === 'repeat' ? 'auto' : 'cover',
    backgroundRepeat: restaurant.coverImageStyle === 'repeat' ? 'repeat' : 'no-repeat',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  } : {}

  const primaryColor = restaurant.colorTheme || '#6366f1'
  const secondaryColor = restaurant.secondaryColor || '#8b5cf6'
  const currency = restaurant.currencySymbol || '$'

  return (
    <>
      {/* Load Google Font if specified */}
      {restaurant.googleFontUrl && (
        <link
          href={restaurant.googleFontUrl}
          rel="stylesheet"
        />
      )}
      
      <div 
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50"
        style={customStyles}
      >
      {/* Restaurant Header */}
      <div className="relative overflow-hidden">
        {/* Hero Section with improved mobile experience */}
        <div 
          className="text-white relative"
          style={{
            background: restaurant.coverImageUrl 
              ? `linear-gradient(135deg, ${primaryColor}ee, ${secondaryColor}ee), ${coverImageStyle.backgroundImage || ''}`
              : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            ...coverImageStyle
          }}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-black/10">
            <div className="absolute top-0 left-0 w-full h-full opacity-30">
              <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute top-40 right-16 w-32 h-32 bg-pink-300/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-20 left-20 w-24 h-24 bg-blue-300/20 rounded-full blur-xl"></div>
            </div>
          </div>
          
          <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
              {/* Restaurant Logo/Image */}
              <div className="flex-shrink-0">
                {restaurant.logoUrl ? (
                  <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-3xl overflow-hidden shadow-2xl bg-white/20 backdrop-blur-sm p-2 border border-white/20">
                    <Image
                      src={restaurant.logoUrl}
                      alt={restaurant.name}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <Utensils className="h-12 w-12 md:h-16 md:w-16 text-white" />
                  </div>
                )}
              </div>
              
              {/* Restaurant Info */}
              <div className="space-y-4 max-w-4xl">
                <div className="space-y-2">
                  <h1 
                    className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
                    style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
                  >
                    {restaurant.name}
                  </h1>
                  {restaurant.tagline && (
                    <p 
                      className="text-lg md:text-xl lg:text-2xl text-white/90 font-light italic max-w-2xl mx-auto"
                      style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
                    >
                      {restaurant.tagline}
                    </p>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="flex flex-wrap justify-center gap-6 text-white/90 text-sm md:text-base">
                  {restaurant.phone && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <Phone className="h-4 w-4" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                  {restaurant.email && (
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{restaurant.email}</span>
                    </div>
                  )}
                </div>
                
                {/* Features */}
                <div className="flex flex-wrap justify-center gap-3">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1.5 text-sm font-medium">
                    <Camera className="h-4 w-4 mr-2" />
                    AR Experience
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1.5 text-sm font-medium">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile Optimized
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1.5 text-sm font-medium">
                    <Globe className="h-4 w-4 mr-2" />
                    Digital Menu
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" fill="none" className="w-full h-8 md:h-12">
              <path d="M0,96L48,80C96,64,192,32,288,26.7C384,21,480,43,576,58.7C672,75,768,85,864,74.7C960,64,1056,32,1152,26.7L1200,21.3V120H1152C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120H0V96Z" fill="rgb(248 250 252)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-6 md:py-12" style={{ fontFamily: restaurant.fontFamily || 'inherit' }}>
        <div className="space-y-8 md:space-y-16">
          {/* Welcome Message */}
          <div className="text-center space-y-4">
            <div className="inline-block">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Our Menu
              </h2>
              <div className="w-20 md:w-32 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full"></div>
            </div>
            <p 
              className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto"
              style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
            >
              {restaurant.description || 'Explore our delicious dishes with immersive AR technology.'}
              <span className="hidden md:inline"> Tap any dish to see it in 3D!</span>
            </p>
            
            {/* Quick AR feature highlight for mobile */}
            <div className="md:hidden bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-purple-700">
                <Camera className="h-5 w-5" />
                <span className="font-medium">AR dishes available - tap to explore!</span>
              </div>
            </div>
          </div>

          {/* Menu Categories */}
          {restaurant.categories.map((category: any, categoryIndex: number) => (
            <section key={category.id} className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-block">
                  <h2 
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900"
                    style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
                  >
                    {restaurant.defaultLocale === 'fr' ? category.nameFr : category.nameEn}
                  </h2>
                  <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mt-2"></div>
                </div>
              </div>
              
              {/* Subcategories */}
              {category.subcategories.map((subcategory: any) => (
                <div key={subcategory.id} className="space-y-6">
                  {subcategory.dishes.length > 0 && (
                    <>
                      <div className="flex items-center justify-center">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        <h3 
                          className="px-6 text-lg md:text-xl font-semibold text-gray-700 bg-white"
                          style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
                        >
                          {restaurant.defaultLocale === 'fr' ? subcategory.nameFr : subcategory.nameEn}
                        </h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      </div>
                      
                      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {subcategory.dishes.map((dish: any) => (
                          <DishCard 
                            key={dish.id} 
                            dish={dish} 
                            locale={restaurant.defaultLocale}
                            restaurantSlug={restaurant.slug}
                            currency={currency}
                            fontFamily={restaurant.fontFamily || undefined}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </section>
          ))}
          
          {/* Uncategorized Dishes */}
          {uncategorizedDishes.length > 0 && (
            <section className="space-y-8">
              <div className="text-center space-y-4">
                <div className="inline-block">
                  <h2 
                    className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900"
                    style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
                  >
                    Special Dishes
                  </h2>
                  <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full mt-2"></div>
                </div>
              </div>
              
              <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {uncategorizedDishes.map((dish: any) => (
                  <DishCard 
                    key={dish.id} 
                    dish={dish} 
                    locale={restaurant.defaultLocale}
                    restaurantSlug={restaurant.slug}
                    currency={currency}
                    fontFamily={restaurant.fontFamily || undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      
    </div>
    </>
  )
}

function DishCard({ dish, locale, restaurantSlug, currency = '$', fontFamily }: { 
  dish: any, 
  locale: string,
  restaurantSlug: string,
  currency?: string,
  fontFamily?: string
}) {
  const hasARModel = dish.usdzUrl || dish.glbUrl
  
  // Mock dietary information - you can add these fields to your database schema
  const isVegetarian = dish.nameEn?.toLowerCase().includes('veggie') || dish.nameEn?.toLowerCase().includes('salad')
  const isSpicy = dish.descriptionEn?.toLowerCase().includes('spicy') || dish.descriptionEn?.toLowerCase().includes('hot')
  
  return (
    <Link href={`/restaurant/${restaurantSlug}/dish/${dish.id}`}>
      <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white shadow-md hover:-translate-y-2 cursor-pointer rounded-2xl">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={dish.imageUrl}
            alt={locale === 'fr' ? dish.nameFr : dish.nameEn}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {dish.isMostPurchased && (
              <Badge className="bg-yellow-100/95 text-yellow-700 border-yellow-200 shadow-lg backdrop-blur-sm">
                <Star className="h-3 w-3 mr-1.5" />
                Popular
              </Badge>
            )}
            {isVegetarian && (
              <Badge className="bg-green-100/95 text-green-700 border-green-200 shadow-lg backdrop-blur-sm">
                <Leaf className="h-3 w-3 mr-1.5" />
                Veggie
              </Badge>
            )}
            {isSpicy && (
              <Badge className="bg-red-100/95 text-red-700 border-red-200 shadow-lg backdrop-blur-sm">
                <Flame className="h-3 w-3 mr-1.5" />
                Spicy
              </Badge>
            )}
          </div>
          
          {/* AR Badge */}
          {hasARModel && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg animate-pulse">
                <Camera className="h-3 w-3 mr-1.5" />
                AR
              </Badge>
            </div>
          )}
          
          {/* Price overlay on mobile */}
          <div className="absolute bottom-3 left-3 md:hidden">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <span 
                className="text-white font-bold text-lg"
                style={{ fontFamily: fontFamily || 'inherit' }}
              >
                {currency}{Number(dish.price).toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Click indicator overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="p-4 md:p-5 space-y-3">
          <div className="space-y-2">
            <h3 
              className="text-lg md:text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors leading-tight"
              style={{ fontFamily: fontFamily || 'inherit' }}
            >
              {locale === 'fr' ? dish.nameFr : dish.nameEn}
            </h3>
            <p 
              className="text-gray-600 text-sm leading-relaxed line-clamp-2"
              style={{ fontFamily: fontFamily || 'inherit' }}
            >
              {locale === 'fr' ? dish.descriptionFr : dish.descriptionEn}
            </p>
          </div>
          
          {/* Price and AR info - desktop only */}
          <div className="hidden md:flex items-center justify-between pt-3 border-t border-gray-100">
            <div 
              className="text-2xl font-bold text-green-600"
              style={{ fontFamily: fontFamily || 'inherit' }}
            >
              {currency}{Number(dish.price).toFixed(2)}
            </div>
            
            {hasARModel && (
              <Badge className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 px-3 py-1">
                <Camera className="h-3 w-3 mr-1.5" />
                View in AR
              </Badge>
            )}
          </div>
          
          {/* Mobile-only AR indicator */}
          {hasARModel && (
            <div className="md:hidden flex items-center justify-center pt-2">
              <Badge className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 px-4 py-1.5">
                <Camera className="h-4 w-4 mr-2" />
                Tap to view in AR
              </Badge>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
