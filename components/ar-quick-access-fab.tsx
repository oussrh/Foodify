"use client"

import { useState, useEffect } from 'react'
import { Camera, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ARQuickAccessFABProps {
  arDishCount: number
  primaryColor?: string
  secondaryColor?: string
  onOpenARGallery?: () => void
}

export default function ARQuickAccessFAB({
  arDishCount,
  primaryColor = '#6366f1',
  secondaryColor = '#8b5cf6',
  onOpenARGallery
}: ARQuickAccessFABProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Show FAB after scrolling down a bit
    const handleScroll = () => {
      if (window.scrollY > 300 && !isDismissed) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isDismissed])

  if (arDishCount === 0 || isDismissed) return null

  return (
    <>
      {/* Floating Action Button */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-500 transform ${
          isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-90'
        }`}
      >
        <div className="relative">
          {/* Pulsing rings animation */}
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{
              backgroundColor: secondaryColor,
              animationDuration: '2s'
            }}
          />

          <Button
            onClick={onOpenARGallery}
            size="lg"
            className="relative h-16 w-16 rounded-full shadow-2xl border-4 border-white hover:scale-110 transition-all duration-300 group"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
            aria-label="View AR dishes"
          >
            <div className="relative">
              <Camera className="h-7 w-7 text-white" />

              {/* Sparkle effect */}
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
            </div>

            {/* Count badge */}
            <Badge
              className="absolute -top-2 -right-2 h-6 min-w-6 rounded-full flex items-center justify-center text-xs font-bold px-2 ring-4 ring-white"
              style={{
                backgroundColor: '#ef4444',
                color: 'white'
              }}
            >
              {arDishCount}
            </Badge>
          </Button>

          {/* Close button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute -top-2 -left-2 h-7 w-7 bg-gray-800 hover:bg-gray-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
            aria-label="Dismiss AR button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-xl whitespace-nowrap">
            View {arDishCount} AR dishes
            <div className="absolute top-full right-6 -mt-1">
              <div className="border-8 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      </div>

      {/* Welcome hint - shows once on first load */}
      {isVisible && (
        <div
          className="fixed bottom-24 right-6 z-40 animate-in slide-in-from-right-4 fade-in duration-500"
          style={{
            animationDelay: '0.5s',
            animationFillMode: 'backwards'
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border-2 p-4 max-w-xs"
            style={{
              borderColor: `${secondaryColor}50`
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 p-2 rounded-full"
                style={{
                  backgroundColor: `${secondaryColor}20`
                }}
              >
                <Camera
                  className="h-5 w-5"
                  style={{ color: secondaryColor }}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Try AR View!
                </p>
                <p className="text-xs text-gray-600">
                  See {arDishCount} dishes in 3D augmented reality
                </p>
              </div>
              <button
                onClick={() => setIsDismissed(true)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
