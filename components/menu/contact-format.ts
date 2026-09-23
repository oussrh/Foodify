import type { MenuRestaurant } from '@/lib/menu'

/** Phone numbers are free text in the database; keep only what a dialer understands. */
export function cleanPhone(raw: string): string {
  return raw.replace(/[^\d+()\-\s.]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * The restaurant's address on one line (street, postcode and city, state, country); null when it
 * has neither a street nor a city.
 */
export function formatAddress(r: Pick<MenuRestaurant, 'streetAddress' | 'city' | 'state' | 'postalCode' | 'country'>): string | null {
  if (!r.streetAddress && !r.city) return null
  const line2 = [r.postalCode, r.city].filter(Boolean).join(' ')
  return [r.streetAddress, line2, r.state, r.country].filter(Boolean).join(', ')
}
