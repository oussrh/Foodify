// lib/print/view.ts
// The Printers section as the page hands it to the browser (server/print/view.ts reads it): when
// tickets print, and each printer with how it is doing. No secret: a printer's address is shown
// once, from the action that made it, and never again.
import type { PrintTriggerInput } from '@/lib/schemas/print'

/** One printer as the settings list shows it. */
export interface PrinterView {
  id: string
  name: string
  /** When it last asked for work, ISO; null if it never has (not set up yet). */
  lastSeenAt: string | null
  lastError: string | null
  /** Jobs it has not printed yet (waiting, or handed out and not answered for). */
  waiting: number
  failed: number
}

/** Everything the Printers section shows for one restaurant. */
export interface PrintView {
  restaurantId: string
  trigger: PrintTriggerInput
  printers: PrinterView[]
}

/** How long a printer may go without asking before it is shown as offline: a few missed polls. */
export const OFFLINE_AFTER_MS = 2 * 60_000

/** Whether a printer last seen at `lastSeenAt` is asking for work, as of `now`. */
export function printerOnline(lastSeenAt: string | null, now: number = Date.now()): boolean {
  return lastSeenAt !== null && now - Date.parse(lastSeenAt) < OFFLINE_AFTER_MS
}

/** The address a printer polls: the one thing its owner types into it. */
export function printerAddress(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, '')}/api/print/epson/${token}`
}
