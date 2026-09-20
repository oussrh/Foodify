"use client"

import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MENU_TEXT, type Locale } from '@/lib/menu'
import { useClientValue } from '@/components/use-client-value'

const ua = () => navigator.userAgent
const onIOS = () => /iPhone|iPad|iPod/i.test(ua())
const onAndroid = () => /Android/i.test(ua())
const arSupport = () => (onIOS() ? 'quick-look' : 'xr' in navigator ? 'webxr' : onAndroid() ? 'scene-viewer' : 'limited')

interface ARLaunchButtonProps {
  dish: {
    id: string
    nameEn: string
    nameFr: string
    usdzUrl: string | null
    glbUrl: string | null
  }
  locale: Locale
  className?: string
}

/**
 * The one AR entry point on customer pages.
 * iOS → AR Quick Look (USDZ); Android → Scene Viewer (GLB) with a web fallback; elsewhere → /ar-viewer.
 */
export default function ARLaunchButton({ dish, locale, className }: ARLaunchButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isIOS = useClientValue(onIOS, false)
  const isAndroid = useClientValue(onAndroid, false)
  const browserSupport = useClientValue(arSupport, 'unknown')
  const device = { isIOS, isAndroid, browserSupport }
  const t = MENU_TEXT[locale]
  const dishName = locale === 'fr' ? dish.nameFr : dish.nameEn

  if (!dish.usdzUrl && !dish.glbUrl) return null

  const recordView = async () => {
    try {
      await fetch('/api/dish-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishId: dish.id,
          arViewed: true,
          deviceType: device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : 'Other',
          browserSupport: device.browserSupport,
        }),
      })
    } catch (error) {
      console.error('Failed to record AR view:', error)
    }
  }

  const webViewerUrl = (glbUrl: string) =>
    `/ar-viewer?model=${encodeURIComponent(glbUrl)}&name=${encodeURIComponent(dishName)}&mode=ar`

  const launch = async () => {
    setIsLoading(true)
    await recordView()

    if (device.isIOS && dish.usdzUrl) {
      const link = document.createElement('a')
      link.href = dish.usdzUrl
      link.setAttribute('rel', 'ar')
      link.appendChild(document.createElement('img'))
      document.body.appendChild(link)
      link.click()
      setTimeout(() => link.remove(), 1000)
    } else if (device.isAndroid && dish.glbUrl) {
      const fallback = window.location.origin + webViewerUrl(dish.glbUrl)
      const intent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(dish.glbUrl)}&mode=ar_preferred&title=${encodeURIComponent(dishName)}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(fallback)};end;`
      window.location.href = intent
      setTimeout(() => {
        if (document.visibilityState === 'visible') window.open(webViewerUrl(dish.glbUrl as string), '_blank')
      }, 2000)
    } else if (dish.glbUrl) {
      window.open(webViewerUrl(dish.glbUrl), '_blank')
    }

    setIsLoading(false)
  }

  return (
    <button
      type="button"
      onClick={launch}
      disabled={isLoading}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-brand px-4 text-[15px] font-semibold text-brand-on transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {isLoading ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Camera className="h-[18px] w-[18px]" />}
      <span>{isLoading ? t.openingAR : t.seeOnTable}</span>
    </button>
  )
}
