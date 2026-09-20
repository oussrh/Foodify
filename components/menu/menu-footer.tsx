"use client"

import { Clock, Facebook, Globe, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react'
import { MENU_TEXT, type Locale, type MenuRestaurant } from '@/lib/menu'
import type { SocialHandles } from '@/lib/social-media'
import { hasStructuredHours, parseOpeningHours, summarizeOpeningHours } from '@/lib/opening-hours'

interface MenuFooterProps {
  restaurant: MenuRestaurant
  social: SocialHandles
  locale: Locale
}

/** Phone numbers are free text in the database; keep only what a dialer understands. */
export function cleanPhone(raw: string): string {
  return raw.replace(/[^\d+()\-\s.]/g, '').replace(/\s+/g, ' ').trim()
}

export function formatAddress(r: Pick<MenuRestaurant, 'streetAddress' | 'city' | 'state' | 'postalCode' | 'country'>): string | null {
  if (!r.streetAddress && !r.city) return null
  const line2 = [r.postalCode, r.city].filter(Boolean).join(' ')
  return [r.streetAddress, line2, r.state, r.country].filter(Boolean).join(', ')
}

export default function MenuFooter({ restaurant, social, locale }: MenuFooterProps) {
  const t = MENU_TEXT[locale]
  const address = formatAddress(restaurant)
  const hours = parseOpeningHours(restaurant.openingHours)
  const hoursLines = summarizeOpeningHours(hours, locale)
  const hasHours = hasStructuredHours(hours) || Boolean(hours.note)
  const hasContact = address || restaurant.phone || restaurant.email || restaurant.website
  const hasSocial = social.instagram || social.facebook || social.twitter
  const year = new Date().getFullYear()

  const row = 'flex items-start gap-2.5 text-sm text-muted-foreground'
  const icon = 'mt-0.5 h-4 w-4 shrink-0 text-brand'

  return (
    <footer className="mt-12 border-t border-border">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="text-lg font-semibold tracking-display">{restaurant.name}</p>
          {restaurant.tagline && <p className="text-sm text-muted-foreground">{restaurant.tagline}</p>}
          {restaurant.cuisineType && <p className="text-sm text-muted-foreground">{restaurant.cuisineType}</p>}
        </div>

        {hasContact && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">{t.contact}</p>
            {address && (
              <a
                className={row + ' hover:text-foreground'}
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className={icon} />
                <span>{address}</span>
              </a>
            )}
            {restaurant.phone && (
              <a className={row + ' hover:text-foreground'} href={`tel:${cleanPhone(restaurant.phone).replace(/[\s().-]/g, '')}`}>
                <Phone className={icon} />
                <span className="tnum">{cleanPhone(restaurant.phone)}</span>
              </a>
            )}
            {restaurant.email && (
              <a className={row + ' hover:text-foreground'} href={`mailto:${restaurant.email}`}>
                <Mail className={icon} />
                <span>{restaurant.email}</span>
              </a>
            )}
            {restaurant.website && (
              <a className={row + ' hover:text-foreground'} href={restaurant.website} target="_blank" rel="noopener noreferrer">
                <Globe className={icon} />
                <span>{restaurant.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
          </div>
        )}

        {(hasHours || hasSocial) && (
          <div className="flex flex-col gap-6">
            {hasHours && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">{t.hours}</p>
                <div className={row}>
                  <Clock className={icon} />
                  <span className="flex flex-col gap-0.5">
                    {hoursLines.map((l) => (
                      <span key={l.days} className="flex justify-between gap-4">
                        <span>{l.days}</span>
                        <span className="tnum">{l.hours}</span>
                      </span>
                    ))}
                    {hours.note && <span className={hoursLines.length > 0 ? 'mt-1 text-xs' : 'whitespace-pre-line'}>{hours.note}</span>}
                  </span>
                </div>
              </div>
            )}
            {hasSocial && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">{t.follow}</p>
                <div className="flex gap-2">
                  {social.instagram && (
                    <a
                      href={`https://instagram.com/${social.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {social.facebook && (
                    <a
                      href={`https://facebook.com/${social.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {social.twitter && (
                    <a
                      href={`https://x.com/${social.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="X"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>© {year} {restaurant.name}</span>
          <span>
            {t.poweredBy}{' '}
            <a href="https://foodify.app" className="font-medium text-foreground hover:underline" target="_blank" rel="noopener noreferrer">
              Foodify
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
