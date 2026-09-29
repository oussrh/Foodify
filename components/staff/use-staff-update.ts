// components/staff/use-staff-update.ts
// A new version of a staff app, waiting. The staff worker never takes over by itself (no
// skipWaiting on install, public/staff-sw.js), because a reload mid-service loses whatever the
// person holding the device was doing; so the app is told a version is waiting, and restarts into
// it only when someone taps.
//
// Finding the version: the worker's file is the same in every build (its version is the `?v=` it
// was registered with), so the browser's own update check never sees a deploy, and a tablet that
// runs all day is never navigated. So every half hour, and whenever the app comes back to the
// screen, it asks GET /api/health which build the server runs; when that is not its own, it
// registers the worker again under the new build, which installs it and leaves it waiting.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { publicEnv } from '@/lib/env'
import { newerBuild } from '@/lib/staff-build'
import { staffScope } from './use-staff-pwa'

const CHECK_EVERY_MS = 30 * 60_000
/** Coming back to the screen checks at most this often: a phone is unlocked many times an hour. */
const RECHECK_AFTER_MS = 60_000

interface StaffUpdate {
  /** A new version has installed and is waiting for this app to restart. */
  waiting: boolean
  /** Hands over to the waiting version and reloads once it has taken control. */
  restart: () => void
}

/** Asks the server which build it runs, and registers the worker under it when it is not this page's. */
async function installNewerBuild(scope: string): Promise<void> {
  const res = await fetch('/api/health', { cache: 'no-store' }).catch(() => null)
  if (!res?.ok) return
  const next = newerBuild(publicEnv.buildId, await res.json().catch(() => null))
  if (next) await navigator.serviceWorker.register(`/staff-sw.js?v=${next}`, { scope }).catch(() => undefined)
}

/**
 * Watches `registration` for a worker that has installed behind the one in control, and calls
 * `onChange` with it, or with null once it has activated (restarted from another tab) or been
 * dropped. Returns the unsubscribe.
 */
function watchWaiting(registration: ServiceWorkerRegistration, onChange: (worker: ServiceWorker | null) => void): () => void {
  const follow = (worker: ServiceWorker) => {
    const onState = () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) onChange(worker)
      if (worker.state === 'activated' || worker.state === 'redundant') onChange(null)
    }
    worker.addEventListener('statechange', onState)
  }
  // Only an update counts: the first worker a device ever installs has no page to replace.
  if (registration.waiting && navigator.serviceWorker.controller) {
    onChange(registration.waiting)
    follow(registration.waiting)
  }
  const onFound = () => {
    if (registration.installing) follow(registration.installing)
  }
  registration.addEventListener('updatefound', onFound)
  return () => registration.removeEventListener('updatefound', onFound)
}

/** Whether a new staff worker is waiting for this page's scope, and the restart into it. Nothing happens without a worker. */
export function useStaffUpdate(): StaffUpdate {
  const [worker, setWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    const scope = staffScope(window.location.pathname)
    if (!publicEnv.isProduction || !scope || !('serviceWorker' in navigator)) return
    let live = true
    let stop = () => {}
    let controlled = false
    let lastCheck = Date.now()
    // Without a worker there is nothing to update, and a check must never be what installs one.
    const check = () => {
      if (!controlled) return
      lastCheck = Date.now()
      void installNewerBuild(scope)
    }
    // `ready` settles once a worker controls this scope: on a first visit, after the register.
    void navigator.serviceWorker.ready.then((registration) => {
      if (!live) return
      controlled = true
      stop = watchWaiting(registration, (next) => {
        if (live) setWorker(next)
      })
    })
    const timer = setInterval(check, CHECK_EVERY_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck > RECHECK_AFTER_MS) check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      live = false
      stop()
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const restart = useCallback(() => {
    if (!worker) return
    // Another tab already restarted into it: this page only needs to load the new version.
    if (worker.state === 'activated') {
      window.location.reload()
      return
    }
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    worker.postMessage({ type: 'SKIP_WAITING' })
  }, [worker])

  return { waiting: worker !== null, restart }
}
