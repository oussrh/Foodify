// lib/schemas/restaurant.ts
// A restaurant's profile, address, business settings and branding, plus its image uploads.
import { z } from 'zod'
import { isTimeZone } from '@/lib/time-zone'
import { MAX_NAME, MAX_TEXT, dietaryKey, email, hexColor, httpsUrl, optionalHttpsUrl, shortText } from './common'

const optionalUrl = z.url('Invalid URL format').optional().or(z.literal(''))
/** A menu font's stylesheet: Google Fonts only, the one host the public menu loads a stylesheet from. */
const googleFontUrl = z
  .url({ protocol: /^https$/, hostname: /^fonts\.googleapis\.com$/, error: 'A font stylesheet from fonts.googleapis.com' })
  .optional()
  .or(z.literal(''))
/** The rule a typed or stored slug meets: lowercase letters, digits and hyphens (lib/slug makes a generated one conform). */
const slugRule = z.string().min(1, 'Slug is required').max(MAX_NAME).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')

/**
 * A whole restaurant as the create form and the settings forms submit it. `slug` here is the
 * rule a typed slug must meet (lowercase, digits, hyphens; lib/slug makes a generated one
 * conform). `openingHours` and `socialMedia` are
 * JSON in a string column (lib/opening-hours, lib/social), whose readers accept the legacy free text
 * too, so they are bounded here and not shaped; the URL fields take '' as "not set" so a cleared
 * field still validates, and the ones a page loads (logo, cover, font) are https only, the font
 * from Google Fonts only: it is a stylesheet on the public menu. The colours are hex. `menuTheme` is not here: the branding tab alone
 * sets it, through `restaurantPatch`. `dietaryOptions` is the subset of the menu's dietary vocabulary
 * this restaurant offers: what the dish forms show and what the public menu filters by.
 * `orderingEnabled` puts the cart on the public menu and lets POST /api/orders take an order;
 * `tableCount` is how many per-table QR codes the Tables tab prints (0 for none).
 */
export const restaurantInput = z.object({
  name: z.string().trim().min(1, 'Name is required').max(MAX_NAME, `At most ${MAX_NAME} characters`),
  slug: slugRule,
  email: email.optional().or(z.literal('')),
  phone: shortText(40),
  tagline: shortText(200),
  logoUrl: optionalHttpsUrl,
  colorTheme: hexColor,
  defaultLocale: z.enum(['en', 'fr']),
  // Address
  streetAddress: shortText(200),
  city: shortText(100),
  state: shortText(100),
  postalCode: shortText(20),
  country: shortText(100),
  // Business
  website: optionalUrl,
  description: shortText(MAX_TEXT),
  cuisineType: shortText(100),
  dietaryOptions: z.array(dietaryKey).optional(),
  orderingEnabled: z.boolean().optional(),
  tableCount: z.number().int().min(0, 'Tables cannot be negative').max(300, 'That is more tables than the sheet can print').optional(),
  /** The restaurant's own clock (lib/time-zone): its sold-out return and its Insights days and hours. */
  timeZone: z.string().refine(isTimeZone, 'Choose a time zone from the list').optional(),
  openingHours: shortText(MAX_TEXT),
  socialMedia: shortText(MAX_TEXT),
  socialDisplay: z.enum(['icons', 'text']).optional(),
  // Design
  coverImageUrl: optionalHttpsUrl,
  coverImageStyle: z.enum(['cover', 'repeat']).optional(),
  secondaryColor: hexColor,
  fontFamily: shortText(60),
  googleFontUrl,
  // Settings
  currency: shortText(3),
  currencySymbol: shortText(4),
})
/** Any subset of `restaurantInput` plus `menuTheme`; a field left out is left as it was. */
export const restaurantPatch = restaurantInput.partial().extend({ menuTheme: z.enum(['system', 'light', 'dark']).optional() })
/** `restaurantInput` after parsing. */
export type RestaurantInput = z.infer<typeof restaurantInput>
/** `restaurantPatch` after parsing. */
export type RestaurantPatch = z.infer<typeof restaurantPatch>

/** A slug as a lookup key (the uploads name their restaurant by it, and so a Cloudinary folder): the same rule a stored one met. */
export const slug = slugRule
/** An https address that was not typed but made by an upload (a logo, a cover): what the branding tab saves straight away. */
export const uploadedImageUrl = httpsUrl

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
/** A logo or cover from a form's `file` field, at most `maxMb`; the messages are what the tile shows. */
export const imageUpload = (maxMb: number) =>
  z
    .instanceof(File, { error: 'No file provided' })
    .refine((f) => IMAGE_TYPES.includes(f.type), 'Invalid file type. Please select a JPG, PNG, WebP, or SVG file.')
    .refine((f) => f.size <= maxMb * 1024 * 1024, `File size must be less than ${maxMb}MB`)
    .refine((f) => !/\.(svg|png|jpg|jpeg|webp)\.(png|jpg|jpeg|webp)$/i.test(f.name), 'File appears to have a double extension. Please rename the file and try again.')
