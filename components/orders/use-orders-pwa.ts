// components/orders/use-orders-pwa.ts
// The board as an app on the tablet: the worker that lets it open without wifi, and the prompt
// that puts it on the home screen. Registered in production only and scoped to this portal's
// /orders routes, so it can never take over the public menu's worker (or be taken over by it).
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'
import { publicEnv } from '@/lib/env'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export interface OrdersPwa {
  /** The browser has offered an install prompt and the board is not already installed. */
  canInstall: boolean
  /** Running from the home screen rather than a browser tab. */
  installed: boolean
  install: () => void
}

/** `/manager/orders/` or `/admin/orders/`: the worker controls one portal's board and nothing else. */
function scopeOf(pathname: string): string | null {
  const match = /^\/(admin|manager)\/orders\//.exec(pathname)
  return match ? `/${match[1]}/orders/` : null
}

export function useOrdersPwa(): OrdersPwa {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null)
  // How the board was opened is a browser fact; installing it during the session is the event's.
  const openedStandalone = useClientValue(() => window.matchMedia('(display-mode: standalone)').matches, false)
  const [installedNow, setInstalledNow] = useState(false)
  const installed = openedStandalone || installedNow

  useEffect(() => {
    const onPrompt = (event: Event) => {
      // Keep the event: the board offers the install on its own button, not the browser's moment.
      event.preventDefault()
      setPrompt(event as InstallEvent)
    }
    const onInstalled = () => {
      setInstalledNow(true)
      setPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    const scope = scopeOf(window.location.pathname)
    if (publicEnv.isProduction && scope && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register(`/orders-sw.js?v=${publicEnv.buildId}`, { scope }).catch(() => undefined)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(() => {
    if (!prompt) return
    void prompt.prompt().then(() => setPrompt(null))
  }, [prompt])

  return { canInstall: prompt !== null && !installed, installed, install }
}
