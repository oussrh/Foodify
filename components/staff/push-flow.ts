// components/staff/push-flow.ts
// Web Push from the device's side, as three moves over the browser's objects and the two server
// actions, handed in so the moves are testable without a browser or a server:
// - on: ask (inside the tap: the permission prompt refuses to open from anything else), subscribe
//   with the deployment's VAPID key, and save the subscription for this restaurant and app;
// - off: tell the server first, then unsubscribe, so a failed save never leaves a device that
//   thinks it is off still being pushed to;
// - refresh, on load: a subscription that exists is saved again, because push services rotate
//   endpoints and the server only knows the one it was last given.
import { urlBase64ToUint8Array } from '@/lib/staff-device'
import type { PushSubscriptionInput } from '@/lib/schemas/push'

type Subscription = PushSubscriptionInput['subscription']

/** The part of a `ServiceWorkerRegistration` the flows use. */
export interface PushRegistration {
  pushManager: Pick<PushManager, 'getSubscription' | 'subscribe'>
}

/** What the flows need from the browser and the server. */
export interface PushDeps {
  /** The staff worker's registration; rejects when it never becomes ready. */
  registration: () => Promise<PushRegistration>
  requestPermission: () => Promise<NotificationPermission>
  save: (subscription: Subscription) => Promise<unknown>
  remove: (endpoint: string) => Promise<unknown>
  /** The deployment's VAPID public key, base64url. */
  vapidKey: string
  /** What a save is for (restaurant and app): a refresh saves each endpoint once per page load for it. */
  saveKey?: string
}

// What this page load has already saved, as saveKey + endpoint: a screen that mounts again (the
// waiter backing out of a table) must not write the same row every time.
const SAVED_THIS_LOAD = new Set<string>()

/** The browser's `toJSON()` in the shape the server takes; a subscription without its keys is refused here. */
export function subscriptionInput({ endpoint, keys }: PushSubscriptionJSON): Subscription {
  const p256dh = keys?.['p256dh']
  const auth = keys?.['auth']
  if (!endpoint || !p256dh || !auth) throw new Error('The browser gave a push subscription without its keys')
  return { endpoint, keys: { p256dh, auth } }
}

/**
 * Asks, subscribes and saves. Call it straight from the tap: the prompt is requested before the
 * first await. Answers the permission reached and whether this device is now subscribed.
 */
export async function turnOnPush(deps: PushDeps): Promise<{ permission: NotificationPermission; subscribed: boolean }> {
  const permission = await deps.requestPermission()
  if (permission !== 'granted') return { permission, subscribed: false }
  const { pushManager } = await deps.registration()
  const subscription =
    (await pushManager.getSubscription()) ??
    (await pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(deps.vapidKey) }))
  await deps.save(subscriptionInput(subscription.toJSON()))
  return { permission, subscribed: true }
}

/** Forgets this device on the server, then unsubscribes it; nothing to do when it is not subscribed. */
export async function turnOffPush(deps: PushDeps): Promise<void> {
  const { pushManager } = await deps.registration()
  const subscription = await pushManager.getSubscription()
  if (!subscription) return
  await deps.remove(subscription.endpoint)
  await subscription.unsubscribe()
}

/** Whether this device is subscribed, saving the subscription again when it is (endpoints rotate). */
export async function refreshPush(deps: PushDeps): Promise<boolean> {
  const { pushManager } = await deps.registration()
  const subscription = await pushManager.getSubscription()
  if (!subscription) return false
  const key = `${deps.saveKey ?? ''}|${subscription.endpoint}`
  if (SAVED_THIS_LOAD.has(key)) return true
  await deps.save(subscriptionInput(subscription.toJSON()))
  SAVED_THIS_LOAD.add(key)
  return true
}
