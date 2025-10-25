"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import SimpleARCamera from '@/components/simple-ar-camera'
import {
  ArrowLeft,
  Star,
  Leaf,
  Flame,
  Wheat,
  Zap,
  ChefHat,
  Camera,
  Share2,
  Heart
} from 'lucide-react'

interface Ingredient {
  id: string
  nameEn: string
  nameFr: string
}

interface DishDetailProps {
  dish: {
    id: string
    nameEn: string
    nameFr: string
    descriptionEn: string | null
    descriptionFr: string | null
    imageUrl: string
    price: number
    calories: number | null
    usdzUrl: string | null
    glbUrl: string | null
    isMostPurchased: boolean
    ingredients: Ingredient[]
  }
  restaurant: {
    id: string
    name: string
    slug: string
    defaultLocale: string
    fontFamily: string | null
    colorTheme: string | null
    secondaryColor: string | null
    currencySymbol: string | null
  }
  subcategory?: {
    nameEn: string
    nameFr: string
  } | null
}

export default function ImprovedDishDetail({ dish, restaurant, subcategory }: DishDetailProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const locale = restaurant.defaultLocale || 'en'
  const hasARModel = dish.usdzUrl || dish.glbUrl
  const dishName = locale === 'fr' ? dish.nameFr : dish.nameEn
  const dishDescription = locale === 'fr' ? dish.descriptionFr : dish.descriptionEn

  const primaryColor = restaurant.colorTheme || '#6366f1'
  const secondaryColor = restaurant.secondaryColor || '#8b5cf6'
  const currency = restaurant.currencySymbol || '$'
  const fontFamily = restaurant.fontFamily || undefined

  // Mock dietary info - should match logic in restaurant page
  const isVegetarian = dish.nameEn?.toLowerCase().includes('veggie') || dish.nameEn?.toLowerCase().includes('salad')
  const isVegan = dish.nameEn?.toLowerCase().includes('vegan')
  const isSpicy = dish.descriptionEn?.toLowerCase().includes('spicy') || dish.descriptionEn?.toLowerCase().includes('hot')
  const isGlutenFree = dish.nameEn?.toLowerCase().includes('gluten-free') || dish.nameEn?.toLowerCase().includes('gf')

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: dishName,
          text: `Check out ${dishName} at ${restaurant.name}!`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-300">
      {/* Header */}
      <div
        className="text-white relative"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href={`/restaurant/${restaurant.slug}`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Menu
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className="text-white hover:bg-white/20 backdrop-blur-sm"
                aria-label="Add to favorites"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-white hover:bg-white/20 backdrop-blur-sm"
                aria-label="Share dish"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Title Section */}
          <div className="mt-6 mb-8">
            <h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3"
              style={{ fontFamily: fontFamily || 'inherit' }}
            >
              {dishName}
            </h1>
            <p className="text-white/90 text-base md:text-lg">
              {restaurant.name}
              {subcategory && (
                <span> • {locale === 'fr' ? subcategory.nameFr : subcategory.nameEn}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Image & AR */}
          <div className="space-y-6">
            {/* Main Image Card */}
            <Card className="overflow-hidden border-0 shadow-xl rounded-3xl dark:bg-gray-800">
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={dish.imageUrl}
                  alt={dishName}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className={`object-cover transition-opacity duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  priority
                />

                {/* Loading skeleton */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
                )}

                {/* Badges Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {dish.isMostPurchased && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg font-bold text-sm px-4 py-2 rounded-full">
                      <Star className="h-4 w-4 mr-2 fill-current" />
                      Popular Choice
                    </Badge>
                  )}
                  {isVegetarian && (
                    <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg font-semibold text-sm px-4 py-2 rounded-full">
                      <Leaf className="h-4 w-4 mr-2" />
                      Vegetarian
                    </Badge>
                  )}
                  {isVegan && (
                    <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 shadow-lg font-semibold text-sm px-4 py-2 rounded-full">
                      <Leaf className="h-4 w-4 mr-2" />
                      Vegan
                    </Badge>
                  )}
                  {isSpicy && (
                    <Badge className="bg-gradient-to-r from-red-400 to-pink-500 text-white border-0 shadow-lg font-semibold text-sm px-4 py-2 rounded-full">
                      <Flame className="h-4 w-4 mr-2" />
                      Spicy
                    </Badge>
                  )}
                  {isGlutenFree && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg font-semibold text-sm px-4 py-2 rounded-full">
                      <Wheat className="h-4 w-4 mr-2" />
                      Gluten-Free
                    </Badge>
                  )}
                </div>

                {/* AR Badge */}
                {hasARModel && (
                  <div className="absolute top-4 right-4">
                    <Badge
                      className="text-white border-0 shadow-xl font-bold text-sm px-4 py-2.5 rounded-full animate-pulse"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      AR Available
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* AR Experience Card */}
            {hasARModel && (
              <Card
                className="border-2 shadow-xl rounded-3xl overflow-hidden"
                style={{
                  borderColor: `${secondaryColor}30`,
                  background: `linear-gradient(135deg, ${secondaryColor}05, ${primaryColor}05)`
                }}
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-3 text-2xl text-gray-900 dark:text-white"
                    style={{ fontFamily: fontFamily || 'inherit' }}
                  >
                    <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30">
                      <Camera className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    AR Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p
                    className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                    style={{ fontFamily: fontFamily || 'inherit' }}
                  >
                    See this dish in stunning 3D on your table! Perfect for visualizing portion size and presentation before ordering.
                  </p>

                  <SimpleARCamera
                    dish={{
                      id: dish.id,
                      nameEn: dish.nameEn,
                      nameFr: dish.nameFr,
                      usdzUrl: dish.usdzUrl || undefined,
                      glbUrl: dish.glbUrl || undefined,
                      imageUrl: dish.imageUrl
                    }}
                    restaurantId={restaurant.id}
                    locale={locale}
                  />

                  <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <p
                      className="text-sm font-medium text-blue-800 dark:text-blue-300"
                      style={{ fontFamily: fontFamily || 'inherit' }}
                    >
                      📱 <strong>Mobile tip:</strong> Point your camera at a flat surface like your table for the best AR experience. You can rotate and resize the model with touch gestures!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Price & Basic Info */}
            <Card className="border-0 shadow-xl rounded-3xl dark:bg-gray-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle
                      className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
                      style={{
                        fontFamily: fontFamily || 'inherit'
                      }}
                    >
                      {dishName}
                    </CardTitle>
                    <div
                      className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white"
                      style={{
                        fontFamily: fontFamily || 'inherit'
                      }}
                    >
                      {currency}{Number(dish.price).toFixed(2)}
                    </div>
                  </div>

                  {dish.calories && (
                    <Badge
                      variant="outline"
                      className="text-base px-4 py-2 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    >
                      <Zap className="h-5 w-5 mr-2 text-amber-500" />
                      {dish.calories} cal
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3
                    className="text-xl font-bold text-gray-900 dark:text-white mb-3"
                    style={{
                      fontFamily: fontFamily || 'inherit'
                    }}
                  >
                    Description
                  </h3>
                  <p
                    className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
                    style={{ fontFamily: fontFamily || 'inherit' }}
                  >
                    {dishDescription || 'A delicious dish prepared with the finest ingredients and utmost care by our expert chefs.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ingredients */}
            {dish.ingredients && dish.ingredients.length > 0 && (
              <Card className="border-0 shadow-xl rounded-3xl dark:bg-gray-800">
                <CardHeader>
                  <CardTitle
                    className="flex items-center gap-3 text-2xl text-gray-900 dark:text-white"
                    style={{
                      fontFamily: fontFamily || 'inherit'
                    }}
                  >
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
                      <ChefHat className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </div>
                    Ingredients ({dish.ingredients.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {dish.ingredients.map((ingredient) => (
                      <Badge
                        key={ingredient.id}
                        variant="outline"
                        className="text-base px-4 py-2.5 rounded-full border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105 transition-all duration-200"
                        style={{
                          fontFamily: fontFamily || 'inherit'
                        }}
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
