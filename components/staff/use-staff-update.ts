// components/staff/use-staff-update.ts
// A new version of a staff app, waiting. The staff worker never takes over by itself (no
// skipWaiting on install, public/staff-sw.js), because a reload mid-service loses whatever the
// person holding the device was doing; so the app is told a version is waiting, and restarts into
// it only when someone taps. A tablet that runs all day is never navigated, so the worker is also
// asked to look for a new version every half hour.
'use client'

import { useCallback, useEffect, useState } from 'react'
import { staffScope } from './use-staff-pwa'

const CHECK_EVERY_MS = 30 * 60_000

interface StaffUpdate {
  /** A new version has installed and is waiting for this app to restart. */
  waiting: boolean
  /** Hands over to the waiting version and reloads once it has taken control. */
  restart: () => void
}

/** Whether a new staff worker is waiting for this page's scope, and the restart into it. */
export function useStaffUpdate(): StaffUpdate {
  const [worker, setWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    const scope = staffScope(window.location.pathname)
    if (!scope || !('serviceWorker' in navigator)) return
    const container = navigator.serviceWorker
    let registration: ServiceWorkerRegistration | undefined
    let live = true
    // Only an update counts: the first worker a device ever installs has no page to replace.
    const offer = (candidate: ServiceWorker | null) => {
      if (live && candidate && container.controller) setWorker(candidate)
    }
    const onFound = () => {
      const installing = registration?.installing
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed') offer(installing)
      })
    }
    void container.getRegistration(scope).then((found) => {
      if (!found || !live) return
      registration = found
      offer(found.waiting)
      found.addEventListener('updatefound', onFound)
    })
    const check = setInterval(() => void registration?.update().catch(() => undefined), CHECK_EVERY_MS)
    return () => {
      live = false
      clearInterval(check)
      registration?.removeEventListener('updatefound', onFound)
    }
  }, [])

  const restart = useCallback(() => {
    if (!worker) return
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    worker.postMessage({ type: 'SKIP_WAITING' })
  }, [worker])

  return { waiting: worker !== null, restart }
}
