// lib/schemas/common.ts
// The pieces every boundary schema is built from (VALID.1, VALID.2). A form validates with the
// same schema its server action parses, so a rule lives here once. Messages are English
// sentences for now: the dashboards have one language and no message catalogue; when one
// exists they become keys (docs/ADOPTION_DECISIONS.md, phase 4).
import { z } from 'zod'
import { ALLERGEN_OPTIONS, DIETARY_OPTIONS } from '@/lib/menu'

/** Every row id is a v4 UUID (Prisma's `@default(uuid())`; verified over the live data on 2026-09-20). */
export const uuid = z.uuid()
/** An address as every form and action takes it; the two sign-in schemas alone (`otpRequest`, `credentials`) stay looser, on purpose. */
export const email = z.email('Please enter a valid email address')
/**
 * How a device account signs in: a short name typed on a tablet keyboard, not an address. Letters,
 * digits, dot, dash and underscore, folded to lower case so `Kitchen1` and `kitchen1` are one name
 * and nobody is locked out by a capital.
 */
export const username = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'A username is at least 3 characters')
  .max(32, 'A username is at most 32 characters')
  .regex(/^[a-z0-9._-]+$/, 'A username may use letters, digits, dot, dash and underscore')

/** What an admin sets for someone else, at creation or on a reset: temporary, hence short. A user's own change is `passwordChange`. */
export const password = z.string().min(6, 'Password must be at least 6 characters')
/** A monetary amount as it travels: a decimal string with at most two fraction digits, normalised to two (API.1; never a float). */
export const money = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a number with at most two decimals')
  .transform((v) => Number(v).toFixed(2))
/** The longest name a row takes: a dish, a category, a restaurant. Past this it is a description. */
export const MAX_NAME = 120
/** The longest free text a form takes (a description, a tagline): a menu is read on a phone. */
export const MAX_TEXT = 2000
/** A short free-text field of a form, at most `max` characters; optional, as the forms send it. */
export const shortText = (max: number) => z.string().max(max, `At most ${max} characters`).optional()
/** Both languages required on every named row: the menu renders the guest's language and has nothing to fall back on (see Locale in lib/menu). */
export const bilingualName = z.object({
  nameEn: z.string().trim().min(1, 'English name is required').max(MAX_NAME, `At most ${MAX_NAME} characters`),
  nameFr: z.string().trim().min(1, 'French name is required').max(MAX_NAME, `At most ${MAX_NAME} characters`),
})
/**
 * A web address the server stores and a page later loads or links: https only, so a stored value
 * can never be `javascript:`, `data:` or plain http. '' is "not set", as a cleared field sends it.
 */
export const httpsUrl = z.url({ protocol: /^https$/, error: 'Enter an https:// address' })
/** `httpsUrl` or '' (not set). */
export const optionalHttpsUrl = httpsUrl.optional().or(z.literal(''))
/** A colour as the pickers store it: #rgb or #rrggbb; '' is "not set". */
export const hexColor = z
  .string()
  .regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Enter a colour as #rrggbb')
  .optional()
  .or(z.literal(''))
/** The message of a failed parse's first issue, what a toast or a tile shows; a failed parse carries at least one, the error's own message stands in otherwise. */
export const firstIssue = (error: z.ZodError): string => error.issues[0]?.message ?? error.message

// A vocabulary key, typed as the strings the rows and the pickers carry; the vocabulary is the runtime rule.
const keyOf = (options: readonly { key: string }[], what: string) =>
  z.string().refine((k) => options.some((o) => o.key === k), `Unknown ${what}`)
/** A dietary attribute the menu can label (a key of DIETARY_OPTIONS); a dish's tags and a restaurant's offered list are arrays of these. */
export const dietaryKey = keyOf(DIETARY_OPTIONS, 'dietary attribute')
/** An allergen the menu can label (a key of ALLERGEN_OPTIONS). */
export const allergenKey = keyOf(ALLERGEN_OPTIONS, 'allergen')
