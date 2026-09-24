// components/restaurant-form/field-labels.ts
// What a restaurant field is called where a refused save names it (a toast, for the fields with no
// error line of their own): the words on the form, not the column names.
import type { RestaurantPatch } from '@/lib/schemas/restaurant'

/** Every restaurant field the create and settings forms hold, by the label the form shows it under. */
export const RESTAURANT_FIELD_LABELS: Readonly<Record<keyof RestaurantPatch, string>> = {
  name: 'Name',
  slug: 'Slug',
  email: 'Email',
  phone: 'Phone',
  tagline: 'Tagline',
  logoUrl: 'Logo',
  colorTheme: 'Brand colour',
  defaultLocale: 'Default language',
  streetAddress: 'Street address',
  city: 'City',
  state: 'State or region',
  postalCode: 'Postal code',
  country: 'Country',
  website: 'Website',
  description: 'Description',
  cuisineType: 'Cuisine',
  dietaryOptions: 'Dietary options',
  orderingEnabled: 'Ordering',
  tableCount: 'Tables',
  timeZone: 'Time zone',
  openingHours: 'Opening hours',
  socialMedia: 'Social links',
  socialDisplay: 'Social links display',
  coverImageUrl: 'Cover photo',
  coverImageStyle: 'Cover fit',
  secondaryColor: 'Secondary colour',
  fontFamily: 'Typeface',
  googleFontUrl: 'Typeface',
  currency: 'Currency',
  currencySymbol: 'Currency symbol',
  menuTheme: 'Menu theme',
}
