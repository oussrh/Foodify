// lib/schemas/order.ts
// A guest's order as the public menu sends it to POST /api/orders. The cart sheet validates the
// table number with `orderTable` before it sends; the handler parses the whole body with
// `orderInput` and re-prices every line from the database, so nothing here carries money.
import { z } from 'zod'
import { MAX_LINES, MAX_NOTE, MAX_QUANTITY } from '@/lib/cart'
import { uuid } from './common'

/** The table the order is for: what is written on the table or carried by the QR link; short, trimmed, required. */
export const orderTable = z.string().trim().min(1, 'Table number is required').max(20, 'Table number is too long')

/**
 * The guest's phone, where the confirmation goes. Written as people write it (spaces, dots,
 * dashes, brackets) and stored as it parses: the separators are dropped, a leading 00 becomes
 * `+`, and what is left is six to fifteen digits, optionally with the `+`. No country is assumed
 * and no national format is enforced: a menu is read by visitors as well as locals.
 */
export const orderPhone = z
  .string()
  .trim()
  .transform((raw) => raw.replace(/[\s.\-()]/g, '').replace(/^00/, '+'))
  .refine((v) => /^\+?[0-9]{6,15}$/.test(v), 'Enter a phone number we can text')

/** A note for the kitchen, at most 300 characters; '' is no note. */
export const orderNote = z.string().trim().max(300, 'The note is too long')

/** What the guest asked for on one dish ("no onions"); '' is no note. */
export const orderLineNote = z.string().trim().max(MAX_NOTE, 'A dish note is too long')

/** One dish, how many, and what was asked for on it: the same bounds as the cart (lib/cart). */
export const orderLineInput = z.object({
  dishId: uuid,
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  note: orderLineNote.optional(),
})

/**
 * The whole order: the restaurant it is for, the table, the phone the confirmation goes to (a
 * guest always gives one; a waiter ordering at the table has nobody to text, which the handler
 * decides, not this shape), the language to write it in, a note for the whole order and one to
 * MAX_LINES lines (each with its own optional note) with no dish twice. Whether the restaurant takes orders, and whether every
 * dish is its own and active, is the handler's check against the database, not a shape.
 */
export const orderInput = z.object({
  restaurantId: uuid,
  table: orderTable,
  /** The guest's number. Absent only when a member of staff is ordering at the table, which the handler checks. */
  phone: orderPhone.optional(),
  /** The language the guest is reading the menu in; the confirmation is written in it. */
  locale: z.enum(['en', 'fr']).optional(),
  note: orderNote.optional(),
  lines: z
    .array(orderLineInput)
    .min(1, 'The order is empty')
    .max(MAX_LINES, 'Too many dishes in one order')
    .refine((lines) => new Set(lines.map((l) => l.dishId)).size === lines.length, 'A dish is listed twice'),
})
/** `orderInput` after parsing. */
export type OrderInput = z.infer<typeof orderInput>

/** What POST /api/orders answers on success: what the confirmation shows the guest. */
export interface PlacedOrder {
  id: string
  number: number
  table: string
  /** The subtotal the server computed, an exact two-decimal string. */
  subtotal: string
}
