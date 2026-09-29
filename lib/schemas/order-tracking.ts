// lib/schemas/order-tracking.ts
// The guest's own view of an order they placed: the secret that names it (handed back once by
// POST /api/orders, stored only as its hash), what GET /api/orders/track/<secret> answers, and
// the short list of recent orders the menu keeps on the guest's device. Each is parsed where it
// crosses a boundary: the route's path, the response the tracker reads, and localStorage.
import { z } from 'zod'
import { ORDER_STATUSES } from '@/lib/orders'

/** The secret in a guest's tracking link (server/secret.ts `newSecret`): 32 URL-safe characters. */
export const guestOrderToken = z.string().regex(/^[A-Za-z0-9_-]{32}$/)

/** The route's `[token]` segment. */
export const trackSegment = z.object({ token: guestOrderToken })

const isoDate = z.iso.datetime()

/**
 * What GET /api/orders/track/<secret> answers: the order as the guest may see it. Lines are what
 * is actually coming (a dish taken off is not listed, a portion taken off is not counted); nothing
 * staff-only (the phone, who took it, the change log, the POS) is part of it.
 */
export const trackedOrder = z.object({
  number: z.number().int(),
  table: z.string(),
  status: z.enum(ORDER_STATUSES),
  lines: z.array(z.object({ nameEn: z.string(), nameFr: z.string(), quantity: z.number().int().min(1) })),
  subtotal: z.string(),
  currency: z.string().nullable(),
  createdAt: isoDate,
  acceptedAt: isoDate.nullable(),
  readyAt: isoDate.nullable(),
  servedAt: isoDate.nullable(),
  restaurant: z.object({ slug: z.string(), name: z.string() }),
})
/** `trackedOrder` after parsing. */
export type TrackedOrder = z.infer<typeof trackedOrder>

/**
 * One order the guest placed from this device, as the menu remembers it: the secret, what the pill
 * says before the first answer (number, table), when it was placed, and the last status seen and
 * when it was seen finished, so an old finished order can be forgotten without asking the server.
 */
export const guestOrderEntry = z.object({
  token: guestOrderToken,
  number: z.number().int(),
  table: z.string().max(20),
  placedAt: isoDate,
  status: z.enum(ORDER_STATUSES),
  finishedAt: isoDate.nullable(),
})
/** `guestOrderEntry` after parsing. */
export type GuestOrderEntry = z.infer<typeof guestOrderEntry>

/** The remembered list as stored; anything else (another version, a hand edit) reads as none. */
export const storedGuestOrders = z.array(guestOrderEntry).max(20).catch([])
