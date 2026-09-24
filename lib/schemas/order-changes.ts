// lib/schemas/order-changes.ts
// What the floor, the pass and a manager send to change a bill after it went to the kitchen:
// cancel a ticket, take a dish off it, void one that went out, answer a request, close, merge,
// un-merge or move a bill. Parsed at the boundary (VALID.1) by the actions in app/actions/, and by
// the reason picker before it sends, so the two refuse the same things. Which restaurant a row
// belongs to is never in here: every action reads it from the row.
import { z } from 'zod'
import { CHANGE_REASONS, MAX_CHANGE_NOTE, reasonComplete } from '@/lib/bill-rules'
import { MAX_QUANTITY } from '@/lib/cart'
import { uuid } from './common'
import { orderTable } from './order'

/** Why: one of the short list, and a note that `other` must carry (at most MAX_CHANGE_NOTE characters). */
export const changeReason = z
  .object({
    reason: z.enum(CHANGE_REASONS),
    note: z.string().trim().max(MAX_CHANGE_NOTE, `At most ${MAX_CHANGE_NOTE} characters`).optional(),
  })
  .refine((value) => reasonComplete(value.reason, value.note), { message: 'Say why in a few words', path: ['note'] })

/** A whole ticket: cancel it (the floor) or void it (a manager). */
export const ticketChange = z.intersection(z.object({ orderId: uuid }), changeReason)
/** `ticketChange` after parsing. */
export type TicketChange = z.infer<typeof ticketChange>

/** Some of one dish: remove it (the floor) or void it (a manager); `quantity` portions, at least one. */
export const lineChange = z.intersection(z.object({ lineId: uuid, quantity: z.number().int().min(1).max(MAX_QUANTITY) }), changeReason)
/** `lineChange` after parsing. */
export type LineChange = z.infer<typeof lineChange>

/** The kitchen's answer to a request: accept it (apply it) or refuse it (leave the ticket as it is). */
export const requestDecision = z.object({ changeId: uuid, accept: z.boolean() })
/** `requestDecision` after parsing. */
export type RequestDecision = z.infer<typeof requestDecision>

/** Close a bill: `force` is the waiter's "close anyway" after being told dishes are still in the kitchen. */
export const billClose = z.object({ billId: uuid, force: z.boolean().default(false) })
/** `billClose` as a caller sends it (`force` may be left out). */
export type BillClose = z.input<typeof billClose>

/** Merge `billId` into `intoId`: two bills of one table, the second becoming part of the first. */
export const billMerge = z.object({ billId: uuid, intoId: uuid }).refine((value) => value.billId !== value.intoId, { message: 'That is the same order', path: ['intoId'] })
/** `billMerge` after parsing. */
export type BillMerge = z.infer<typeof billMerge>

/** Undo the merge that made `billId` part of another bill. */
export const billUnmerge = z.object({ billId: uuid })
/** `billUnmerge` after parsing. */
export type BillUnmerge = z.infer<typeof billUnmerge>

/**
 * Move a bill to `table`. `mergeInto` names the open bill already at that table when the waiter
 * chose "Move and merge": the move and the merge are then one change, or neither.
 */
export const billMove = z.object({ billId: uuid, table: orderTable, mergeInto: uuid.optional() })
/** `billMove` after parsing. */
export type BillMove = z.infer<typeof billMove>

/** Whose change log to read: one ticket or one bill. */
export const changeLogQuery = z.object({ orderId: uuid })
/** `changeLogQuery` after parsing. */
export type ChangeLogQuery = z.infer<typeof changeLogQuery>
