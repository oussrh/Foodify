"use client"

import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Camera,
  Eye,
  Star,
  Leaf,
  Flame,
  Wheat,
  Zap
} from 'lucide-react'
import { useState } from 'react'

interface DishCardProps {
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
    isVegetarian?: boolean
    isVegan?: boolean
    isSpicy?: boolean
    isGlutenFree?: boolean
  }
  locale: string
  restaurantSlug: string
  currency?: string
  fontFamily?: string
  primaryColor?: string
  secondaryColor?: string
  onQuickAR?: () => void
}

export default function ImprovedDishCard({
  dish,
  locale,
  restaurantSlug,
  currency = '$',
  fontFamily,
  primaryColor = '#6366f1',
  secondaryColor = '#8b5cf6',
  onQuickAR
}: DishCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const hasARModel = dish.usdzUrl || dish.glbUrl

  const dishName = locale === 'fr' ? dish.nameFr : dish.nameEn
  const dishDescription = locale === 'fr' ? dish.descriptionFr : dish.descriptionEn

  const handleQuickAR = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onQuickAR) {
      onQuickAR()
    }
  }

  return (
    <Link href={`/restaurant/${restaurantSlug}/dish/${dish.id}`} className="block">
      <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-800 shadow-md hover:-translate-y-2 cursor-pointer rounded-3xl h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-gray-100">
          <Image
            src={dish.imageUrl}
            alt={dishName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            priority={false}
          />

          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
          )}

          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {dish.isMostPurchased && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-lg font-bold text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                Popular
              </Badge>
            )}
            {dish.isVegetarian && (
              <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg font-semibold text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Leaf className="h-3.5 w-3.5 mr-1.5" />
                Veggie
              </Badge>
            )}
            {dish.isVegan && (
              <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 shadow-lg font-semibold text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Leaf className="h-3.5 w-3.5 mr-1.5" />
                Vegan
              </Badge>
            )}
            {dish.isSpicy && (
              <Badge className="bg-gradient-to-r from-red-400 to-pink-500 text-white border-0 shadow-lg font-semibold text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Flame className="h-3.5 w-3.5 mr-1.5" />
                Spicy
              </Badge>
            )}
            {dish.isGlutenFree && (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 shadow-lg font-semibold text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Wheat className="h-3.5 w-3.5 mr-1.5" />
                GF
              </Badge>
            )}
          </div>

          {/* Top Right - AR Badge */}
          {hasARModel && (
            <div className="absolute top-3 right-3 z-10">
              <Badge
                className="text-white border-0 shadow-xl font-bold text-xs px-4 py-2 rounded-full ring-2 ring-white/30 backdrop-blur-sm animate-pulse"
                style={{
                  backgroundColor: secondaryColor
                }}
              >
                <Camera className="h-4 w-4 mr-1.5" />
                AR
              </Badge>
            </div>
          )}

          {/* Price Badge - Mobile Only */}
          <div className="absolute bottom-3 right-3 md:hidden z-10">
            <div
              className="backdrop-blur-xl rounded-2xl px-4 py-2 shadow-xl border-2 border-white/30"
              style={{
                backgroundColor: `${primaryColor}F0`
              }}
            >
              <span
                className="text-white font-bold text-lg"
                style={{ fontFamily: fontFamily || 'inherit' }}
              >
                {currency}{Number(dish.price).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Hover Overlay with Quick Actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="transform scale-75 group-hover:scale-100 transition-all duration-300 flex flex-col gap-3 items-center">
              <div
                className="bg-white/95 backdrop-blur-md rounded-full p-4 shadow-2xl ring-4 ring-white/30"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                  backdropFilter: 'blur(12px)'
                }}
              >
                <Eye
                  className="h-7 w-7"
                  style={{ color: primaryColor }}
                />
              </div>

              {hasARModel && onQuickAR && (
                <Button
                  onClick={handleQuickAR}
                  size="sm"
                  className="text-white font-semibold shadow-xl border-2 border-white/30 backdrop-blur-sm"
                  style={{
                    backgroundColor: secondaryColor
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Quick AR
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 flex flex-col flex-1">
          <div className="flex-1 space-y-3">
            {/* Title */}
            <h3
              className="text-lg md:text-xl font-bold text-gray-900 dark:text-white transition-all duration-300 leading-tight line-clamp-2 min-h-[3.5rem]"
              style={{
                fontFamily: fontFamily || 'inherit'
              }}
            >
              {dishName}
            </h3>

            {/* Description */}
            <p
              className="text-gray-600 dark:text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-2 min-h-[2.5rem]"
              style={{ fontFamily: fontFamily || 'inherit' }}
            >
              {dishDescription || 'Delicious dish prepared with care and quality ingredients.'}
            </p>

            {/* Calories Badge */}
            {dish.calories && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs font-medium border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                >
                  <Zap className="h-3 w-3 mr-1 text-amber-500" />
                  {dish.calories} cal
                </Badge>
              </div>
            )}
          </div>

          {/* Price and AR Button - Desktop */}
          <div className="hidden md:flex items-center justify-between pt-4 mt-auto border-t border-gray-100 dark:border-gray-700">
            <div
              className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white transition-all duration-300"
              style={{
                fontFamily: fontFamily || 'inherit'
              }}
            >
              {currency}{Number(dish.price).toFixed(2)}
            </div>

            {hasARModel && (
              <Badge
                className="border px-4 py-2 rounded-full font-semibold text-sm transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: `${secondaryColor}15`,
                  color: secondaryColor,
                  borderColor: `${secondaryColor}30`
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                View in AR
              </Badge>
            )}
          </div>

          {/* AR Button - Mobile Only */}
          {hasARModel && (
            <div className="md:hidden flex items-center justify-center pt-4 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-full font-semibold shadow-sm border-2 transition-all duration-300 active:scale-95"
                style={{
                  backgroundColor: `${secondaryColor}10`,
                  color: secondaryColor,
                  borderColor: `${secondaryColor}30`
                }}
              >
                <Camera className="h-4 w-4 mr-2" />
                Tap to view in AR
              </Button>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
