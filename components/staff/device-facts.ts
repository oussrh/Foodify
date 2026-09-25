// components/staff/device-facts.ts
// Two browser facts the staff apps branch on, read in one place so the install row and the
// notifications row can never disagree about the device in front of them. Both are read through
// `useClientValue` (they are fixed for the page's life, and a server render has neither).
import { isAppleMobile } from '@/lib/staff-device'

/**
 * Opened from the home screen rather than a browser tab: the display mode on Android and desktop,
 * and Safari's own `navigator.standalone` on an iPhone or iPad, which older iOS reports instead.
 * The manifest asks for full screen first, so an installed app on Android reports `fullscreen`
 * rather than `standalone`; a browser tab put full screen by the device sheet's button reports it
 * too, but then an element holds the full screen, which an installed app's window does not. A
 * desktop browser put full screen with F11 reports it as well, with no element and a mouse, so
 * full screen counts only on a touch screen, which is where the staff apps are installed.
 */
export function readStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  const touch = window.matchMedia('(pointer: coarse)').matches
  if (touch && window.matchMedia('(display-mode: fullscreen)').matches && !document.fullscreenElement) return true
  return (navigator as Navigator & { standalone?: boolean }).standalone === true
}

/** An iPhone or iPad (`isAppleMobile`), read from this browser's navigator. */
export function readAppleMobile(): boolean {
  return isAppleMobile(navigator)
}
