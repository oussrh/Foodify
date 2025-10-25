"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Loader2 } from 'lucide-react'

interface SimpleARCameraProps {
  dish: {
    id: string
    nameEn: string
    nameFr: string
    usdzUrl?: string
    glbUrl?: string
    imageUrl: string
  }
  restaurantId: string
  locale: string
}

export default function SimpleARCamera({ dish, restaurantId, locale }: SimpleARCameraProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    browserSupport: 'unknown'
  })

  const dishName = locale === 'fr' ? dish.nameFr : dish.nameEn
  const hasARModel = dish.usdzUrl || dish.glbUrl

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const userAgent = navigator.userAgent
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent)
      const isAndroid = /Android/i.test(userAgent)
      const isMobile = isIOS || isAndroid

      let browserSupport = 'limited'
      if (isIOS && 'DocumentPictureInPicture' in window) {
        browserSupport = 'full'
      } else if ('xr' in navigator) {
        browserSupport = 'webxr'
      } else if (isAndroid) {
        browserSupport = 'scene-viewer'
      }

      setDeviceInfo({ isIOS, isAndroid, isMobile, browserSupport })
    }
  }, [])

  if (!hasARModel) {
    return null
  }

  const recordARView = async () => {
    try {
      await fetch('/api/dish-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dishId: dish.id,
          arViewed: true,
          deviceType: deviceInfo.isIOS ? 'iOS' :
                     deviceInfo.isAndroid ? 'Android' : 'Other',
          browserSupport: deviceInfo.browserSupport
        }),
      })
    } catch (error) {
      console.error('Failed to record AR view:', error)
    }
  }

  const launchARExperience = async () => {
    setIsLoading(true)

    // Record the AR view
    await recordARView()

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    if (deviceInfo.isIOS && dish.usdzUrl) {
      // iOS devices use USDZ files with AR Quick Look - this opens the native camera
      const link = document.createElement('a')
      link.href = dish.usdzUrl
      link.setAttribute('rel', 'ar')
      // Add AR Quick Look attributes for better camera integration
      link.setAttribute('data-ar', 'true')
      link.setAttribute('data-ar-scale', 'true')
      link.setAttribute('data-ar-placement', 'floor')
      document.body.appendChild(link)

      // Force click to trigger AR Quick Look camera
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      })
      link.dispatchEvent(clickEvent)

      // Clean up
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link)
        }
      }, 1000)

    } else if (deviceInfo.isAndroid && dish.glbUrl) {
      // Android devices - use scene-viewer intent which opens native AR camera
      const sceneViewerUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(dish.glbUrl)}&mode=ar_preferred&title=${encodeURIComponent(dishName)}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(window.location.origin + '/ar-viewer?model=' + encodeURIComponent(dish.glbUrl) + '&name=' + encodeURIComponent(dishName) + '&mode=ar')};end;`

      // Try to launch native AR first
      window.location.href = sceneViewerUrl

      // Fallback to web AR viewer after a delay if native doesn't work
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          window.open(`/ar-viewer?model=${encodeURIComponent(dish.glbUrl || '')}&name=${encodeURIComponent(dishName)}&mode=ar`, '_blank')
        }
      }, 2000)

    } else if (dish.glbUrl) {
      // Desktop or other devices - use WebXR/model-viewer in AR mode
      window.open(`/ar-viewer?model=${encodeURIComponent(dish.glbUrl)}&name=${encodeURIComponent(dishName)}&mode=ar`, '_blank')
    }

    setIsLoading(false)
  }

  return (
    <Button
      onClick={launchARExperience}
      disabled={isLoading}
      size="lg"
      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Opening AR Camera...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          <span>Open AR Camera</span>
        </div>
      )}
    </Button>
  )
}