// components/staff/use-staff-pwa.ts
// A staff app on the device it is used from: the worker that lets it open without wifi, and the
// prompt that puts it on the home screen. Serves the kitchen board, the tablet and the waiter's
// phone; the caller gives its own scope, so one app can never take over another's worker, and
// none of them can take over the public menu's (or be taken over by it). Production only.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { useClientValue } from '@/components/use-client-value'
import { publicEnv } from '@/lib/env'
import { readStandalone } from './device-facts'

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

export interface StaffPwa {
  /** The browser has offered an install prompt and the app is not already installed. */
  canInstall: boolean
  /** Running from the home screen rather than a browser tab. */
  installed: boolean
  install: () => void
}

/**
 * The scope a staff app's worker controls, from the path it is open at: one portal's board, the
 * kitchen tablet, or the waiter's phone. Null anywhere else, and nothing is registered — a worker
 * with too wide a scope would answer for pages it knows nothing about.
 */
export function staffScope(pathname: string): string | null {
  const portal = /^\/(admin|manager)\/orders\//.exec(pathname)
  if (portal) return `/${portal[1]}/orders/`
  if (pathname.startsWith('/kitchen/')) return '/kitchen/'
  if (pathname.startsWith('/waiter/')) return '/waiter/'
  return null
}

/**
 * A staff app's install state and install prompt; in production it also registers `staff-sw.js` for
 * the current path's own scope, and nothing outside the staff paths.
 */
export function useStaffPwa(): StaffPwa {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null)
  // How the board was opened is a browser fact; installing it during the session is the event's.
  // An iPhone reports it through `navigator.standalone` as well as the display mode (device-facts.ts).
  const openedStandalone = useClientValue(readStandalone, false)
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

    const scope = staffScope(window.location.pathname)
    if (publicEnv.isProduction && scope && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register(`/staff-sw.js?v=${publicEnv.buildId}`, { scope }).catch(() => undefined)
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
