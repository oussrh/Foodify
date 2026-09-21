/** The subset of the settings form the contact panel edits, as the form watches it: an unset field is `undefined`. */
export interface ContactFormValues {
  name: string
  email?: string | undefined
  phone?: string | undefined
  website?: string | undefined
  streetAddress?: string | undefined
  city?: string | undefined
  state?: string | undefined
  postalCode?: string | undefined
  country?: string | undefined
  openingHours?: string | undefined
  socialMedia?: string | undefined
  socialDisplay?: 'icons' | 'text' | undefined
}
