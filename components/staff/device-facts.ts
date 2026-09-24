// components/staff/device-facts.ts
// Two browser facts the staff apps branch on, read in one place so the install row and the
// notifications row can never disagree about the device in front of them. Both are read through
// `useClientValue` (they are fixed for the page's life, and a server render has neither).
import { isAppleMobile } from '@/lib/staff-device'

/**
 * Opened from the home screen rather than a browser tab: the display mode on Android and desktop,
 * and Safari's own `navigator.standalone` on an iPhone or iPad, which older iOS reports instead.
 */
export function readStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** An iPhone or iPad (`isAppleMobile`), read from this browser's navigator. */
export function readAppleMobile(): boolean {
  return isAppleMobile(navigator)
}
