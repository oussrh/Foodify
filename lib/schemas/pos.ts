// lib/schemas/pos.ts
// What an owner (or a super admin for them), a POS's webhook and Vercel's cron send about a point of sale,
// parsed at the boundary (VALID.1): the POS actions in app/actions/pos-*.ts, the forms of the
// Integrations tab before they send, the webhook route and the outbox cron. The restaurant is
// always a separate argument of an action, parsed first so the guard can be asked about it.
import { z } from 'zod'
import { uuid } from './common'

/** A provider as the registry names it (lib/pos/registry.ts): lower case, digits and dashes. */
export const posProviderKey = z
  .string()
  .trim()
  .min(1, 'Choose a POS')
  .max(40, 'Choose a POS')
  .regex(/^[a-z0-9-]+$/, 'Choose a POS')

/** Signing in to a POS with an API key: which POS, and the key as the owner pasted it. */
export const posConnectInput = z.object({
  provider: posProviderKey,
  apiKey: z.string().trim().min(8, 'An API key is at least 8 characters').max(400, 'At most 400 characters'),
})
/** `posConnectInput` after parsing. */
export type PosConnectInput = z.infer<typeof posConnectInput>

/** A POS's own id for a location or an item: opaque text, bounded. */
const externalId = z.string().trim().min(1).max(120)

/** The location tickets go to, one of those the POS listed. */
export const posLocationInput = z.object({ locationId: externalId })
/** `posLocationInput` after parsing. */
export type PosLocationInput = z.infer<typeof posLocationInput>

/** The most dishes one save matches: a menu, not a catalogue. */
export const MAX_MAPPED_DISHES = 500

/** Which POS item each dish is rung up as; null leaves a dish unmatched. */
export const posMappingInput = z.object({
  items: z
    .array(z.object({ dishId: uuid, externalItemId: externalId.nullable() }))
    .max(MAX_MAPPED_DISHES, `At most ${MAX_MAPPED_DISHES} dishes at a time`)
    .refine((items) => new Set(items.map((item) => item.dishId)).size === items.length, 'A dish is listed twice'),
})
/** `posMappingInput` after parsing. */
export type PosMappingInput = z.infer<typeof posMappingInput>

/** Resuming a paused connection: send what waited during the pause, or discard it. */
export const posResumeInput = z.object({ waiting: z.enum(['send', 'discard']) })
/** `posResumeInput` after parsing. */
export type PosResumeInput = z.infer<typeof posResumeInput>

/** Where a webhook is addressed: the provider in the path, the connection it was registered for in `?connection=`. */
export const posWebhookTarget = z.object({ provider: posProviderKey, connection: uuid })

/** A cron call's `Authorization` header: `Bearer <secret>`, answered as the secret. */
export const cronAuthorization = z
  .string()
  .regex(/^Bearer \S+$/)
  .transform((header) => header.slice('Bearer '.length))

/** An event as the Test POS sends it (lib/pos/test-adapter.ts); a real vendor's adapter parses its own. */
export const testPosEvent = z.object({
  id: externalId,
  type: z.enum(['PAID', 'CLOSED', 'ITEM_UNAVAILABLE', 'MENU_CHANGED']),
  location: externalId,
  bill: externalId.optional(),
  item: externalId.optional(),
})
