"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Utensils, Phone, MapPin, Clock } from 'lucide-react'
import RestaurantMenuClient from './restaurant-menu-client'
import RestaurantFooter from './restaurant-footer'
import LanguageSwitcher from './language-switcher'
import { Button } from './ui/button'

interface RestaurantPageClientProps {
  restaurant: any
  uncategorizedDishes: any[]
  currency: string
  primaryColor: string
  secondaryColor: string
  coverImageStyle: any
}

export default function RestaurantPageClient({
  restaurant,
  uncategorizedDishes,
  currency,
  primaryColor,
  secondaryColor,
  coverImageStyle
}: RestaurantPageClientProps) {
  const [locale, setLocale] = useState(restaurant.defaultLocale)

  const customStyles = {
    fontFamily: restaurant.fontFamily || 'Inter, system-ui, sans-serif',
    ...(restaurant.googleFontUrl && {
      '--restaurant-font': restaurant.fontFamily || 'Inter'
    })
  } as React.CSSProperties

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-950 dark:to-black relative transition-colors duration-300"
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

          {/* Language Switcher - Top Right */}
          <div className="absolute top-4 right-4 z-10">
            <LanguageSwitcher
              currentLocale={locale}
              onLocaleChange={setLocale}
              primaryColor={primaryColor}
            />
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

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-3 duration-600" style={{ animationDelay: '0.3s' }}>
                  {restaurant.phone && (
                    <a href={`tel:${restaurant.phone}`}>
                      <Button
                        size="lg"
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white/40 text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 rounded-full px-6 sm:px-8"
                      >
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="font-semibold">Call Now</span>
                      </Button>
                    </a>
                  )}
                  {restaurant.streetAddress && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${restaurant.streetAddress}, ${restaurant.city || ''}, ${restaurant.state || ''}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="lg"
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white/40 text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 rounded-full px-6 sm:px-8"
                      >
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="font-semibold">Directions</span>
                      </Button>
                    </a>
                  )}
                  {restaurant.openingHours && (
                    <Button
                      size="lg"
                      className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 border-white/40 text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 rounded-full px-6 sm:px-8"
                      onClick={() => {
                        const element = document.getElementById('menu-section')
                        element?.scrollIntoView({ behavior: 'smooth' })
                      }}
                    >
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="font-semibold">View Hours</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced bottom wave decoration - full width, dark mode compatible */}
          <div className="absolute bottom-0 left-0 right-0 w-full">
            <svg
              viewBox="0 0 1200 120"
              fill="none"
              className="w-full h-12 md:h-16 lg:h-20 block text-white dark:text-gray-900"
              preserveAspectRatio="none"
              style={{ width: '100%', display: 'block' }}
            >
              <path d="M0,96L48,80C96,64,192,32,288,26.7C384,21,480,43,576,58.7C672,75,768,85,864,74.7C960,64,1056,32,1152,26.7L1200,21.3V120H1152C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120H0V96Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>

      {/* Menu Content - Now with Search, Filters, and Enhanced UI */}
      <div id="menu-section">
        <RestaurantMenuClient
          categories={restaurant.categories as any}
          uncategorizedDishes={uncategorizedDishes as any}
          locale={locale}
          restaurantSlug={restaurant.slug}
          currency={currency}
          fontFamily={restaurant.fontFamily || undefined}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      </div>

      {/* Restaurant Footer */}
      <RestaurantFooter
        restaurant={{
          name: restaurant.name,
          address: restaurant.streetAddress
            ? `${restaurant.streetAddress}${restaurant.city ? `, ${restaurant.city}` : ''}${restaurant.state ? `, ${restaurant.state}` : ''}${restaurant.postalCode ? ` ${restaurant.postalCode}` : ''}${restaurant.country ? `, ${restaurant.country}` : ''}`
            : null,
          phone: restaurant.phone,
          email: restaurant.email,
          website: restaurant.website,
          openingHours: restaurant.openingHours,
          instagramHandle: restaurant.socialMedia ? (JSON.parse(restaurant.socialMedia).instagram || null) : null,
          facebookHandle: restaurant.socialMedia ? (JSON.parse(restaurant.socialMedia).facebook || null) : null,
          twitterHandle: restaurant.socialMedia ? (JSON.parse(restaurant.socialMedia).twitter || null) : null,
        }}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        fontFamily={restaurant.fontFamily || undefined}
      />
    </div>
  )
}
