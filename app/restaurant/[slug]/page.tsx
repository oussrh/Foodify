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
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 relative"
        style={customStyles}
      >
      {/* Restaurant Header */}
      <div className="relative overflow-hidden">
        {/* Hero Section with enhanced mobile-first design */}
        <div 
          className="text-white relative min-h-[50vh] sm:min-h-[45vh] md:min-h-[55vh] flex items-center"
          style={{
            background: restaurant.coverImageUrl 
              ? `linear-gradient(135deg, ${primaryColor}CC, ${secondaryColor}CC), ${coverImageStyle.backgroundImage}` 
              : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            ...coverImageStyle
          }}
        >
          {/* Enhanced background overlay with animated elements */}
          <div className="absolute inset-0">
            {/* Animated background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute top-10 left-10 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute top-32 right-8 w-24 h-24 sm:w-32 sm:h-32 bg-white/15 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '3s' }}></div>
              <div className="absolute bottom-20 left-8 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 right-1/3 w-12 h-12 bg-white/5 rounded-full blur-lg animate-ping" style={{ animationDuration: '4s' }}></div>
            </div>
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30"></div>
          </div>
          
          <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12 relative z-10">
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-8 animate-in fade-in duration-800 slide-in-from-bottom-5">
              {/* Restaurant Logo/Image with enhanced mobile design */}
              <div className="flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
                {restaurant.logoUrl ? (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-3xl overflow-hidden shadow-2xl bg-white/20 backdrop-blur-sm p-2 border border-white/30 ring-4 ring-white/10">
                    <Image
                      src={restaurant.logoUrl}
                      alt={restaurant.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 ring-4 ring-white/10 flex items-center justify-center">
                    <Utensils className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 text-white" />
                  </div>
                )}
              </div>
              
              {/* Restaurant Info with enhanced mobile typography */}
              <div className="space-y-6 max-w-4xl px-2">
                <div className="space-y-4">
                  <h1 
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white drop-shadow-2xl animate-in slide-in-from-bottom-6 duration-600"
                    style={{ 
                      fontFamily: restaurant.fontFamily || 'inherit',
                      textShadow: '0 0 20px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 0, 0, 0.8), 0 4px 15px rgba(0, 0, 0, 0.8), 0 2px 6px rgba(0, 0, 0, 0.6)',
                      WebkitTextStroke: '1px rgba(0, 0, 0, 0.2)',
                      animationDelay: '0.1s'
                    }}
                  >
                    {restaurant.name}
                  </h1>
                  {restaurant.tagline && (
                    <div 
                      className="backdrop-blur-md bg-black/50 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 mx-auto inline-block border border-white/40 shadow-2xl animate-in slide-in-from-bottom-4 duration-600"
                      style={{ animationDelay: '0.2s' }}
                    >
                      <p 
                        className="text-sm sm:text-base md:text-lg text-white font-light max-w-2xl leading-relaxed"
                        style={{ 
                          fontFamily: restaurant.fontFamily || 'inherit',
                          textShadow: '0 0 15px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.8), 0 1px 4px rgba(0, 0, 0, 0.6)'
                        }}
                      >
                        {restaurant.tagline}
                      </p>
                    </div>
                  )}
                </div>
                
                
              </div>
            </div>
          </div>
          
          {/* Enhanced bottom wave decoration - full width */}
          <div className="absolute bottom-0 left-0 right-0 w-full">
            <svg 
              viewBox="0 0 1200 120" 
              fill="none" 
              className="w-full h-12 md:h-16 lg:h-20 block"
              preserveAspectRatio="none"
              style={{ width: '100%', display: 'block' }}
            >
              <path d="M0,96L48,80C96,64,192,32,288,26.7C384,21,480,43,576,58.7C672,75,768,85,864,74.7C960,64,1056,32,1152,26.7L1200,21.3V120H1152C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120H0V96Z" fill="white" />
            </svg>
          </div>
        </div>
      </div>

      {/* Menu Content with enhanced mobile spacing */}
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12 lg:py-16" style={{ fontFamily: restaurant.fontFamily || 'inherit' }}>
        <div className="space-y-12 sm:space-y-14 md:space-y-16 lg:space-y-20">
          {/* Enhanced Welcome Message with mobile-first design */}
          <div className="text-center space-y-6 sm:space-y-8 animate-in fade-in duration-800">
            <div className="inline-block">
              <h2 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight"
                style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
              >
                Our Menu
              </h2>
              <div 
                className="w-24 sm:w-32 md:w-40 h-1.5 mx-auto rounded-full shadow-sm"
                style={{ 
                  backgroundColor: primaryColor
                }}
              ></div>
            </div>
            <p 
              className="text-gray-600 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed px-4"
              style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
            >
              {restaurant.description || 'Explore our delicious dishes with immersive AR technology.'}
              <span className="hidden sm:inline"> Tap any dish to see it in 3D!</span>
            </p>
            
            {/* Enhanced AR feature highlight for mobile */}
            <div 
              className="sm:hidden rounded-3xl p-5 border shadow-lg mx-4 animate-in slide-in-from-bottom-4 duration-600"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
                borderColor: `${primaryColor}30`,
                animationDelay: '0.3s'
              }}
            >
              <div 
                className="flex items-center justify-center gap-3"
                style={{ color: primaryColor }}
              >
                <div 
                  className="p-2 rounded-full"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Camera className="h-5 w-5" />
                </div>
                <span className="font-semibold text-base">AR dishes available - tap to explore!</span>
              </div>
            </div>
          </div>

          {/* Enhanced Menu Categories with staggered animations */}
          {restaurant.categories.map((category: any, categoryIndex: number) => (
            <section 
              key={category.id} 
              className="space-y-10 sm:space-y-12 animate-in fade-in duration-800" 
              style={{ animationDelay: `${categoryIndex * 0.1}s` }}
            >
              <div className="text-center space-y-6">
                <div className="inline-block">
                  <h2 
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight"
                    style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
                  >
                    {restaurant.defaultLocale === 'fr' ? category.nameFr : category.nameEn}
                  </h2>
                  <div 
                    className="w-20 sm:w-28 md:w-32 h-1.5 mx-auto rounded-full mt-3 shadow-sm"
                    style={{ 
                      backgroundColor: primaryColor
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Enhanced Subcategories with better mobile layout */}
              {category.subcategories.map((subcategory: any, subIndex: number) => (
                <div 
                  key={subcategory.id} 
                  className="space-y-8 animate-in slide-in-from-bottom-4 duration-600" 
                  style={{ animationDelay: `${(categoryIndex * 0.1) + (subIndex * 0.05)}s` }}
                >
                  {subcategory.dishes.length > 0 && (
                    <>
                      <div className="flex items-center justify-center px-4">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                        <h3 
                          className="px-6 sm:px-8 text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700 bg-white whitespace-nowrap"
                          style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
                        >
                          {restaurant.defaultLocale === 'fr' ? subcategory.nameFr : subcategory.nameEn}
                        </h3>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                      </div>
                      
                      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {subcategory.dishes.map((dish: any) => (
                          <DishCard 
                            key={dish.id} 
                            dish={dish} 
                            locale={restaurant.defaultLocale}
                            restaurantSlug={restaurant.slug}
                            currency={currency}
                            fontFamily={restaurant.fontFamily || undefined}
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </section>
          ))}
          
          {/* Enhanced Uncategorized Dishes */}
          {uncategorizedDishes.length > 0 && (
            <section 
              className="space-y-10 sm:space-y-12 animate-in fade-in duration-800" 
              style={{ animationDelay: `${restaurant.categories.length * 0.1}s` }}
            >
              <div className="text-center space-y-6">
                <div className="inline-block">
                  <h2 
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight"
                    style={{ fontFamily: restaurant.fontFamily || 'inherit' }}
                  >
                    Special Dishes
                  </h2>
                  <div 
                    className="w-20 sm:w-28 md:w-32 h-1.5 mx-auto rounded-full mt-3 shadow-sm"
                    style={{ 
                      backgroundColor: primaryColor
                    }}
                  ></div>
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
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
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

function DishCard({ dish, locale, restaurantSlug, currency = '$', fontFamily, primaryColor, secondaryColor }: { 
  dish: any, 
  locale: string,
  restaurantSlug: string,
  currency?: string,
  fontFamily?: string,
  primaryColor?: string,
  secondaryColor?: string
}) {
  const hasARModel = dish.usdzUrl || dish.glbUrl
  
  // Mock dietary information - you can add these fields to your database schema
  const isVegetarian = dish.nameEn?.toLowerCase().includes('veggie') || dish.nameEn?.toLowerCase().includes('salad')
  const isSpicy = dish.descriptionEn?.toLowerCase().includes('spicy') || dish.descriptionEn?.toLowerCase().includes('hot')
  
  return (
    <Link href={`/restaurant/${restaurantSlug}/dish/${dish.id}`}>
      <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white shadow-lg hover:shadow-xl hover:-translate-y-3 cursor-pointer rounded-3xl backdrop-blur-sm">
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl">
          <Image
            src={dish.imageUrl}
            alt={locale === 'fr' ? dish.nameFr : dish.nameEn}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Enhanced top badges with mobile-first design */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {dish.isMostPurchased && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg backdrop-blur-sm font-semibold text-xs px-3 py-1.5 rounded-full">
                <Star className="h-3 w-3 mr-1.5 fill-current" />
                Popular
              </Badge>
            )}
            {isVegetarian && (
              <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-white border-0 shadow-lg backdrop-blur-sm font-semibold text-xs px-3 py-1.5 rounded-full">
                <Leaf className="h-3 w-3 mr-1.5" />
                Veggie
              </Badge>
            )}
            {isSpicy && (
              <Badge className="bg-gradient-to-r from-red-400 to-pink-400 text-white border-0 shadow-lg backdrop-blur-sm font-semibold text-xs px-3 py-1.5 rounded-full">
                <Flame className="h-3 w-3 mr-1.5" />
                Spicy
              </Badge>
            )}
          </div>
          
          {/* Enhanced AR Badge */}
          {hasARModel && (
            <div className="absolute top-3 right-3 z-10">
              <Badge 
                className="text-white border-0 shadow-xl animate-pulse font-bold text-xs px-4 py-2 rounded-full ring-2 ring-white/30"
                style={{ 
                  backgroundColor: secondaryColor || '#8b5cf6'
                }}
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" />
                AR
              </Badge>
            </div>
          )}
          
          {/* Enhanced price overlay on mobile */}
          <div className="absolute bottom-3 left-3 md:hidden z-10">
            <div className="bg-black/80 backdrop-blur-md rounded-2xl px-3 py-2 shadow-xl border border-white/20">
              <span 
                className="text-white font-bold text-lg"
                style={{ 
                  fontFamily: fontFamily || 'inherit',
                  color: primaryColor ? '#fff' : '#fff'
                }}
              >
                {currency}{Number(dish.price).toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Enhanced click indicator overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
            <div className="transform scale-75 group-hover:scale-100 transition-all duration-500 ease-out">
              <div 
                className="bg-white/95 backdrop-blur-md rounded-full p-4 shadow-2xl ring-4 ring-white/30 animate-pulse"
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor || '#6366f1'}15, ${secondaryColor || '#8b5cf6'}15)`,
                  backdropFilter: 'blur(12px)'
                }}
              >
                <Eye 
                  className="h-7 w-7" 
                  style={{ color: primaryColor || '#6366f1' }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-5 md:p-6 space-y-4">
          <div className="space-y-3">
            <h3 
              className="text-lg md:text-xl font-bold transition-all duration-300 leading-tight line-clamp-2"
              style={{ 
                fontFamily: fontFamily || 'inherit',
                color: primaryColor || '#6366f1'
              }}
            >
              {locale === 'fr' ? dish.nameFr : dish.nameEn}
            </h3>
            <p 
              className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3 group-hover:text-gray-700 transition-colors duration-300"
              style={{ fontFamily: fontFamily || 'inherit' }}
            >
              {locale === 'fr' ? dish.descriptionFr : dish.descriptionEn}
            </p>
          </div>
          
          {/* Enhanced price and AR info - desktop only */}
          <div className="hidden md:flex items-center justify-between pt-4 border-t border-gray-100/60">
            <div 
              className="text-lg lg:text-xl font-bold transition-all duration-300 group-hover:scale-105"
              style={{ 
                fontFamily: fontFamily || 'inherit',
                color: primaryColor || '#16a34a'
              }}
            >
              {currency}{Number(dish.price).toFixed(2)}
            </div>
            
            {hasARModel && (
              <Badge 
                className="border px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: `${secondaryColor || '#8b5cf6'}10`,
                  color: secondaryColor || '#8b5cf6',
                  borderColor: `${secondaryColor || '#8b5cf6'}30`
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                View in AR
              </Badge>
            )}
          </div>
          
          {/* Enhanced mobile-only AR indicator */}
          {hasARModel && (
            <div className="md:hidden flex items-center justify-center pt-3">
              <Badge 
                className="border px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg transition-all duration-300 active:scale-95"
                style={{
                  backgroundColor: `${secondaryColor || '#8b5cf6'}15`,
                  color: secondaryColor || '#8b5cf6',
                  borderColor: `${secondaryColor || '#8b5cf6'}30`
                }}
              >
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
