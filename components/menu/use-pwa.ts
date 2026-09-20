'use client'

import { useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from 'react'
import { publicEnv } from '@/lib/env'
import { useClientValue } from '@/components/use-client-value'
import { isIOS as isIOSDevice } from '@/lib/device'

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
const SW_URL = `/sw.js?v=${publicEnv.buildId}`

const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true

// Connectivity is an external store: the browser fires online/offline, we read navigator.onLine.
const subscribeOnline = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}
const readOnline = () => navigator.onLine

interface WorkerHandlers {
  onPrecached: () => void
  onUpdateReady: () => void
  onControllerChange: () => void
  sendPrecache: (active: ServiceWorker) => void
}

/** Registers the worker and wires its lifecycle to the hook's handlers; returns the cleanup. */
function registerServiceWorker(handlers: WorkerHandlers) {
  let disposed = false
  const onMessage = (e: MessageEvent) => {
    if (e.data?.type === 'PRECACHED') handlers.onPrecached()
  }
  navigator.serviceWorker.addEventListener('message', onMessage)

  // A new worker took control after we asked it to skip waiting: the page is now stale.
  let refreshing = false
  const onControllerChange = () => {
    if (refreshing) return
    refreshing = true
    handlers.onControllerChange()
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
          if (worker.state === 'installed' && navigator.serviceWorker.controller) handlers.onUpdateReady()
        })
      }
      if (reg.waiting && navigator.serviceWorker.controller) handlers.onUpdateReady()
      reg.addEventListener('updatefound', () => trackWaiting(reg.installing))

      // Save the whole menu for offline use once the page is idle.
      const ready = await navigator.serviceWorker.ready
      const send = () => {
        if (ready.active) handlers.sendPrecache(ready.active)
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

/** Registers the menu service worker (production only) and exposes install, offline-readiness and connectivity. */
export function usePwa({ precacheUrls, onUpdate }: UsePwaOptions) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installedNow, setInstalledNow] = useState(false)
  const standalone = useClientValue(isInstalled, false) || installedNow
  const isIOS = useClientValue(isIOSDevice, false)
  const online = useSyncExternalStore(subscribeOnline, readOnline, () => true)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateReady, setUpdateReady] = useState(false)
  const precacheSent = useRef(false)

  // The worker registers once, but the precache list and the callback belong to the latest render.
  const sendPrecache = useEffectEvent((active: ServiceWorker) => {
    if (precacheSent.current) return
    precacheSent.current = true
    active.postMessage({ type: 'PRECACHE', urls: precacheUrls })
  })
  const notifyUpdate = useEffectEvent(() => onUpdate?.())

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalledNow(true)
      setInstallEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    let cleanupSw = () => {}
    if (publicEnv.isProduction && 'serviceWorker' in navigator) {
      cleanupSw = registerServiceWorker({
        onPrecached: () => setOfflineReady(true),
        onUpdateReady: () => setUpdateReady(true),
        onControllerChange: () => notifyUpdate(),
        sendPrecache: (active) => sendPrecache(active),
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      cleanupSw()
    }
  }, [])

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
