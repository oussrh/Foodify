// lib/schemas/restaurant.ts
// A restaurant's profile, address, business settings and branding, plus its image uploads.
import { z } from 'zod'
import { email } from './common'

const optionalUrl = z.url('Invalid URL format').optional().or(z.literal(''))

export const restaurantInput = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  email: email.optional().or(z.literal('')),
  phone: z.string().optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().optional(),
  colorTheme: z.string().optional(),
  defaultLocale: z.enum(['en', 'fr']),
  // Address
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  // Business
  website: optionalUrl,
  description: z.string().optional(),
  cuisineType: z.string().optional(),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  openingHours: z.string().optional(),
  socialMedia: z.string().optional(),
  // Design
  coverImageUrl: optionalUrl,
  coverImageStyle: z.enum(['cover', 'repeat']).optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  googleFontUrl: z.string().optional(),
  // Settings
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
})
export const restaurantPatch = restaurantInput.partial().extend({ menuTheme: z.enum(['system', 'light', 'dark']).optional() })
export type RestaurantInput = z.infer<typeof restaurantInput>
export type RestaurantPatch = z.infer<typeof restaurantPatch>

export const slug = z.string().min(1)

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
/** A logo or cover from a form's `file` field, at most `maxMb`; the messages are what the tile shows. */
export const imageUpload = (maxMb: number) =>
  z
    .instanceof(File, { error: 'No file provided' })
    .refine((f) => IMAGE_TYPES.includes(f.type), 'Invalid file type. Please select a JPG, PNG, WebP, or SVG file.')
    .refine((f) => f.size <= maxMb * 1024 * 1024, `File size must be less than ${maxMb}MB`)
    .refine((f) => !/\.(svg|png|jpg|jpeg|webp)\.(png|jpg|jpeg|webp)$/i.test(f.name), 'File appears to have a double extension. Please rename the file and try again.')
