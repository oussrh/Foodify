// lib/schemas/print.ts
// What an owner (or a super admin for them) sends about the kitchen's printers, parsed at the
// boundary: the actions in app/actions/print-actions.ts and the Printers section's forms before
// they send. The restaurant is always a separate argument of an action, parsed first so the guard
// can be asked about it.
import { z } from 'zod'

/** What the kitchen calls a printer ("Pass", "Grill"): what the settings list and the board show. */
export const printerName = z.string().trim().min(1, 'Give the printer a name').max(40, 'At most 40 characters')

/** When a kitchen ticket prints: as soon as it arrives, or when the kitchen accepts it. */
export const printTrigger = z.enum(['ARRIVAL', 'ACCEPT'])
/** `printTrigger` after parsing. */
export type PrintTriggerInput = z.infer<typeof printTrigger>

/** The secret in a printer's address (server/secret.ts): 32 URL-safe characters. */
export const printerToken = z.string().regex(/^[A-Za-z0-9_-]{32}$/)

/**
 * What an Epson printer posts to its address (Server Direct Print): which call it is, and with a
 * result, the result file. Other fields (its ID, its name) are not read.
 */
export const eposCall = z.object({
  ConnectionType: z.string().max(40),
  ResponseFile: z.string().max(256 * 1024).optional(),
})
