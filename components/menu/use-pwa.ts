'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePwaOptions {
  /** Everything this menu needs to work offline: its page, manifest, dish photos. */
  precacheUrls: string[]
  /** Called when a newer service worker has taken over; the page should offer a refresh. */
  onUpdate?: () => void
}

export type InstallPlatform = 'prompt' | 'ios' | 'none'

/** The service worker URL carries the build id, so every deploy ships a fresh worker and cache. */
const SW_URL = `/sw.js?v=${process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || process.env.NEXT_PUBLIC_BUILD_ID || 'dev'}`

/** Registers the menu service worker (production only) and exposes install, offline-readiness and connectivity. */
export function usePwa({ precacheUrls, onUpdate }: UsePwaOptions) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [standalone, setStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [online, setOnline] = useState(true)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const precacheSent = useRef(false)
  const urlsRef = useRef(precacheUrls)
  urlsRef.current = precacheUrls

  useEffect(() => {
    const ua = navigator.userAgent
    setIsIOS(/iPhone|iPad|iPod/.test(ua) && !('MSStream' in window))
    setStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true)
    setOnline(navigator.onLine)

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setStandalone(true)
      setInstallEvent(null)
    }
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    let cleanupSw = () => {}
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      cleanupSw = registerServiceWorker()
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      cleanupSw()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function registerServiceWorker() {
    let disposed = false
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PRECACHED') setOfflineReady(true)
    }
    navigator.serviceWorker.addEventListener('message', onMessage)

    // A new worker took control after we asked it to skip waiting: the page is now stale.
    let refreshing = false
    const onControllerChange = () => {
      if (refreshing) return
      refreshing = true
      onUpdate?.()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    navigator.serviceWorker
      .register(SW_URL)
      .then(async (reg) => {
        if (disposed) return
        // Offer a refresh when a newer version is waiting behind the current one.
        const trackWaiting = (worker: ServiceWorker | null) => {
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) setUpdateReady(true)
          })
        }
        if (reg.waiting && navigator.serviceWorker.controller) setUpdateReady(true)
        reg.addEventListener('updatefound', () => trackWaiting(reg.installing))

        // Save the whole menu for offline use once the page is idle.
        const ready = await navigator.serviceWorker.ready
        const send = () => {
          if (precacheSent.current || !ready.active) return
          precacheSent.current = true
          ready.active.postMessage({ type: 'PRECACHE', urls: urlsRef.current })
        }
        if ('requestIdleCallback' in window) window.requestIdleCallback(send, { timeout: 4000 })
        else setTimeout(send, 1500)

        // Installed apps refresh the saved menu in the background (Chromium only; needs engagement).
        const periodic = (ready as ServiceWorkerRegistration & { periodicSync?: { register: (tag: string, o: { minInterval: number }) => Promise<void> } }).periodicSync
        if (periodic) {
          try {
            const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName })
            if (status.state === 'granted') await periodic.register('refresh-menu', { minInterval: 24 * 60 * 60 * 1000 })
          } catch {
            /* not available */
          }
        }
      })
      .catch((err) => console.warn('Service worker not registered:', err))

    return () => {
      disposed = true
      navigator.serviceWorker.removeEventListener('message', onMessage)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }

  const install = useCallback(async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setInstallEvent(null)
  }, [installEvent])

  const applyUpdate = useCallback(async () => {
    const reg = await navigator.serviceWorker?.getRegistration()
    reg?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  }, [])

  const installPlatform: InstallPlatform = standalone ? 'none' : installEvent ? 'prompt' : isIOS ? 'ios' : 'none'

  return { installPlatform, install, online, offlineReady, updateReady, applyUpdate, standalone }
}
