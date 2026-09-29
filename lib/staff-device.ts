// lib/staff-device.ts
// What a staff device can do, as plain facts in and a plain answer out: whether it is an iPhone or
// an iPad (which decides how it installs and whether it can be asked for notifications at all),
// the push key in the form the browser takes, and which of the notification states the device is
// in. The hooks read the browser; this decides, so the decision is testable without one.

/** The navigator fields that tell an Apple mobile device apart. */
export interface DeviceFacts {
  userAgent: string
  platform: string
  maxTouchPoints: number
}

/**
 * An iPhone, iPod or iPad. iPadOS asks for the desktop site and reports itself as a Mac, so a
 * "Mac" with a touch screen is an iPad: no Mac has one.
 */
export function isAppleMobile({ userAgent, platform, maxTouchPoints }: DeviceFacts): boolean {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true
  return platform === 'MacIntel' && maxTouchPoints > 1
}

/**
 * A VAPID public key as it is published (base64url, unpadded) in the form
 * `pushManager.subscribe` takes as `applicationServerKey`.
 */
export function urlBase64ToUint8Array(value: string): Uint8Array<ArrayBuffer> {
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

/**
 * Where a device stands with notifications, each state one thing to tell the person holding it:
 * - `development`: the worker registers in production only, so there is nothing to push to;
 * - `unconfigured`: no VAPID key was set for this deployment;
 * - `install-first`: an iPhone or iPad in Safari, which offers push only to an installed app;
 * - `update-ios`: installed on one whose iOS is older than 16.4, which has no push at all;
 * - `unsupported`: a browser without the Push API, whatever else it is;
 * - `denied`: refused once, which only the device's own settings can undo;
 * - `ask`: never asked; `off`: allowed but not subscribed here; `on`: subscribed.
 */
export type PushAvailability = 'development' | 'unconfigured' | 'install-first' | 'update-ios' | 'unsupported' | 'denied' | 'ask' | 'off' | 'on'

/** What `pushAvailability` decides from; `permission` is `Notification.permission` as read. */
export interface PushFacts {
  production: boolean
  configured: boolean
  appleMobile: boolean
  standalone: boolean
  /** The browser has `PushManager`, a service worker and `Notification`. */
  pushApi: boolean
  permission: NotificationPermission
  subscribed: boolean
}

/** The one state of `PushAvailability` these facts put the device in, first reason first. */
export function pushAvailability(facts: PushFacts): PushAvailability {
  if (!facts.production) return 'development'
  if (!facts.configured) return 'unconfigured'
  if (!facts.pushApi) {
    if (!facts.appleMobile) return 'unsupported'
    return facts.standalone ? 'update-ios' : 'install-first'
  }
  if (facts.permission === 'denied') return 'denied'
  if (facts.permission !== 'granted') return 'ask'
  return facts.subscribed ? 'on' : 'off'
}

/**
 * Whether this page load opens on the launch screen: only when the app runs from the home screen
 * (a browser tab has its own loading), and only the first load of the session, so moving between
 * the app's screens or reloading one never shows it again.
 */
export function launchScreenDue({ installed, seenThisSession }: { installed: boolean; seenThisSession: boolean }): boolean {
  return installed && !seenThisSession
}

/** What the invitation to install offers: the browser's own prompt, Safari's Share steps, or nothing. */
export type InstallInvitation = 'prompt' | 'share-steps' | null

/**
 * The install invitation a device gets, once: none when the app is installed or the invitation was
 * dismissed; the browser's prompt where it offered one (Android, desktop Chrome); the Share → Add to
 * Home Screen steps on an iPhone or iPad, which has no prompt; and nothing on a browser that has
 * neither, where the device sheet's install row still says how.
 */
export function installInvitation(facts: { installed: boolean; dismissed: boolean; canInstall: boolean; appleMobile: boolean }): InstallInvitation {
  if (facts.installed || facts.dismissed) return null
  if (facts.canInstall) return 'prompt'
  return facts.appleMobile ? 'share-steps' : null
}
