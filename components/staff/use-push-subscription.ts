// components/staff/use-push-subscription.ts
// Notifications for a staff device: where it stands (`pushAvailability`, one honest state), and
// the two taps that change it. The moves are `push-flow.ts`; here is the browser they run in —
// the worker's registration, the permission as it is now (it can be changed from the device's
// settings while the page is open, and the Permissions API says so), and the server actions.
'use client'

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { removePushSubscription, savePushSubscription } from '@/app/actions/push-actions'
import { useClientValue } from '@/components/use-client-value'
import { pushAvailability, type PushAvailability } from '@/lib/staff-device'
import { publicEnv } from '@/lib/env'
import type { StaffPushApp } from '@/lib/schemas/push'
import { readAppleMobile, readStandalone } from './device-facts'
import { refreshPush, turnOffPush, turnOnPush, type PushDeps } from './push-flow'

/** Which app a device's pushes are for: a kitchen board, or the waiter's phone. */

export interface PushControl {
  availability: PushAvailability
  busy: boolean
  /** What went wrong with the last tap, in words for the person holding the device. */
  error: string | null
  turnOn: () => void
  turnOff: () => void
}

/** How long the staff worker gets to become ready before the tap is reported as failed. */
const READY_TIMEOUT = 10_000

const hasPushApi = () => 'PushManager' in window && 'serviceWorker' in navigator && 'Notification' in window
const readPermission = (): NotificationPermission => ('Notification' in window ? Notification.permission : 'default')

/** Hears a permission changed from the device's own settings, where the Permissions API reports it. */
function subscribePermission(onChange: () => void): () => void {
  let status: PermissionStatus | null = null
  let live = true
  navigator.permissions?.query({ name: 'notifications' }).then(
    (answer) => {
      if (!live) return
      status = answer
      answer.addEventListener('change', onChange)
    },
    () => undefined,
  )
  return () => {
    live = false
    status?.removeEventListener('change', onChange)
  }
}

/** The staff worker's registration, or a rejection when it is not ready in time. */
function workerRegistration(): Promise<ServiceWorkerRegistration> {
  const late = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('worker not ready')), READY_TIMEOUT))
  // A worker installed by a deploy waits while a board stays open, and push lives in the worker:
  // one from before push existed has no push handler, so a waiting version is activated here.
  // Activation does not reload the page; the fetch handling of the two versions is the same.
  return Promise.race([navigator.serviceWorker.ready, late]).then((registration) => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
    return registration
  })
}

/**
 * This device's notifications for `restaurantId`'s `app`: its state, and the taps that turn them
 * on and off. On load an existing subscription is saved again, since endpoints rotate.
 */
export function usePushSubscription(restaurantId: string, app: StaffPushApp): PushControl {
  const pushApi = useClientValue(hasPushApi, false)
  const appleMobile = useClientValue(readAppleMobile, false)
  const standalone = useClientValue(readStandalone, false)
  const permission = useSyncExternalStore(subscribePermission, readPermission, () => 'default' as const)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vapidKey = publicEnv.vapidPublicKey
  const usable = publicEnv.isProduction && Boolean(vapidKey) && pushApi
  const deps = useMemo<PushDeps>(
    () => ({
      registration: workerRegistration,
      requestPermission: () => Notification.requestPermission(),
      save: (subscription) => savePushSubscription({ restaurantId, app, subscription }),
      remove: (endpoint) => removePushSubscription({ endpoint }),
      vapidKey: vapidKey ?? '',
      saveKey: `${restaurantId}:${app}`,
    }),
    [restaurantId, app, vapidKey],
  )

  useEffect(() => {
    if (!usable || permission !== 'granted') return
    let live = true
    refreshPush(deps).then(
      (found) => {
        if (live) setSubscribed(found)
      },
      () => undefined,
    )
    return () => {
      live = false
    }
  }, [usable, permission, deps])

  const run = useCallback((move: () => Promise<boolean>, failure: string) => {
    setBusy(true)
    setError(null)
    move().then(
      (now) => setSubscribed(now),
      () => setError(failure),
    ).finally(() => setBusy(false))
  }, [])

  const turnOn = useCallback(
    () => run(() => turnOnPush(deps).then((result) => result.subscribed), 'Notifications could not be turned on. Check the connection and try again.'),
    [run, deps],
  )
  const turnOff = useCallback(() => run(() => turnOffPush(deps).then(() => false), 'Notifications could not be turned off. Try again.'), [run, deps])

  const availability = pushAvailability({
    production: publicEnv.isProduction,
    configured: Boolean(vapidKey),
    appleMobile,
    standalone,
    pushApi,
    permission,
    subscribed,
  })
  return { availability, busy, error, turnOn, turnOff }
}
