// lib/schemas/push.ts
// A staff device's Web Push subscription as the browser hands it over (`PushSubscription.toJSON()`)
// and the app it is for. The endpoint is where the server will later POST, so it is not any URL
// the body names: it must be https on a known push service's host, or the subscription endpoint
// becomes a way to make the server call an address of the caller's choosing (SSRF).
import { z } from 'zod'
import { httpsUrl, uuid } from './common'

/**
 * The staff apps a push can wake: `board` is any kitchen board (the tablet's `/kitchen/orders`,
 * a manager's or an admin's `/orders`), `waiter` is the waiter's phone.
 */
export const STAFF_PUSH_APPS = ['board', 'waiter'] as const

// The browsers' push services. Exact hosts, then suffixes that only a subdomain can match (the
// leading dot is what refuses `evilpush.apple.com` and `fcm.googleapis.com.evil.example`).
// Chrome and every Chromium browser but Edge use FCM; Edge uses WNS; Firefox uses Mozilla's
// autopush; Safari, macOS and iOS use Apple's.
const PUSH_HOSTS = ['fcm.googleapis.com', 'android.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com']
const PUSH_HOST_SUFFIXES = ['.push.services.mozilla.com', '.push.apple.com', '.notify.windows.com']

// The host as the raw text spells it: letters, digits, dots and hyphens, ended by the first '/'.
// web-push sends with Node's legacy `url.parse`, which reads a host differently from the WHATWG
// `URL` this file checks with (`https://evil.com;.push.apple.com/` is Apple's to one and evil.com
// to the other). Nothing either parser could read another way gets through: no port, no
// credentials, no percent-escape, no ';', no backslash, and both parsers must agree on the host.
const RAW_HOST = /^https:\/\/([a-z0-9-]+(?:\.[a-z0-9-]+)+)\/[^\s\\]*$/i

/** Whether a URL is on a push service's host, spelled so that every URL parser reads the same host. */
function isPushService(value: string): boolean {
  const raw = RAW_HOST.exec(value)?.[1]?.toLowerCase()
  // zod runs a refinement after a failed format check too, so this may see a string that is not a URL.
  if (!raw || !URL.canParse(value) || new URL(value).hostname !== raw) return false
  return PUSH_HOSTS.includes(raw) || PUSH_HOST_SUFFIXES.some((suffix) => raw.endsWith(suffix))
}

/** Where a push is sent: an https address on a browser's push service, and nowhere else. */
const endpoint = httpsUrl.max(2048, 'The push endpoint is too long').refine(isPushService, 'Not a push service address')

// The subscription's keys are base64url (unpadded as browsers send them; padding tolerated).
// p256dh is a 65-byte P-256 point (87 characters), auth 16 bytes (22): the bounds leave room.
const base64url = (max: number) => z.string().min(16).max(max).regex(/^[A-Za-z0-9_-]+={0,2}$/, 'Not a base64url key')

/** What `savePushSubscription` takes: the restaurant, the app, and the browser's subscription. */
export const pushSubscriptionInput = z.object({
  restaurantId: uuid,
  app: z.enum(STAFF_PUSH_APPS),
  subscription: z.object({
    endpoint,
    keys: z.object({ p256dh: base64url(128), auth: base64url(64) }),
  }),
})
/** `pushSubscriptionInput` after parsing. */
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInput>

/** What `removePushSubscription` takes: the endpoint the device is giving up. */
export const pushEndpointInput = z.object({ endpoint })
/** `pushEndpointInput` after parsing. */
export type PushEndpointInput = z.infer<typeof pushEndpointInput>
/** One of `STAFF_PUSH_APPS`. */
export type StaffPushApp = (typeof STAFF_PUSH_APPS)[number]
