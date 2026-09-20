// components/restaurant-form/panel-values.ts
// The two panels' views of the settings form's watched values: the branding panel takes
// every field with its empty default, the contact panel takes the contact fields as they are.
import type { BrandingValues } from '@/components/branding/branding-panel'
import type { ContactFormValues } from '@/components/contact/contact-panel'
import type { EditRestaurantValues } from './edit-restaurant-schema'

/** The branding fields that are plain text: an unset one is the empty string. */
const BRANDING_TEXT_FIELDS = [
  'name',
  'tagline',
  'cuisineType',
  'city',
  'currencySymbol',
  'logoUrl',
  'coverImageUrl',
  'colorTheme',
  'fontFamily',
  'googleFontUrl',
] as const

/** The branding panel's view of the settings form's watched values: every field with its empty default. */
export function toBrandingValues(values: Partial<EditRestaurantValues>): BrandingValues {
  const text = {} as Record<(typeof BRANDING_TEXT_FIELDS)[number], string>
  for (const field of BRANDING_TEXT_FIELDS) text[field] = values[field] || ''
  return {
    ...text,
    coverImageStyle: (values.coverImageStyle || 'cover') as 'cover' | 'repeat',
    menuTheme: (values.menuTheme || 'system') as 'system' | 'light' | 'dark',
  }
}

/** The contact panel's view of the settings form's watched values: the contact fields as they are. */
export function toContactValues(values: Partial<EditRestaurantValues>): ContactFormValues {
  return {
    name: values.name || '',
    email: values.email,
    phone: values.phone,
    website: values.website,
    streetAddress: values.streetAddress,
    city: values.city,
    state: values.state,
    postalCode: values.postalCode,
    country: values.country,
    openingHours: values.openingHours,
    socialMedia: values.socialMedia,
  }
}
