"use client"

import { Clock, Globe, Mail, MapPin, Phone } from 'lucide-react'
import { type Locale, type MenuRestaurant } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import type { SocialHandles } from '@/lib/social'
import { summarizeOpeningHours, type OpeningHours } from '@/lib/opening-hours'
import OpeningHoursLines from '@/components/opening-hours-lines'
import { cleanPhone } from './contact-format'
import SocialList from './social-list'

const row = 'flex items-start gap-2.5 text-sm text-muted-foreground'
const icon = 'mt-0.5 h-4 w-4 shrink-0 text-brand'

/** The name, the tagline and the cuisine. */
export function FooterBrand({ restaurant }: { restaurant: MenuRestaurant }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-lg font-semibold tracking-display">{restaurant.name}</p>
      {restaurant.tagline && <p className="text-sm text-muted-foreground">{restaurant.tagline}</p>}
      {restaurant.cuisineType && <p className="text-sm text-muted-foreground">{restaurant.cuisineType}</p>}
    </div>
  )
}

interface FooterContactProps {
  restaurant: MenuRestaurant
  address: string | null
  locale: Locale
}

/** Address, phone, email and website as links a phone can act on. */
export function FooterContact({ restaurant, address, locale }: FooterContactProps) {
  const t = MENU_TEXT[locale]
  return (
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
  )
}

/** The grouped weekly summary and the free-text note. */
export function FooterHours({ hours, locale }: { hours: OpeningHours; locale: Locale }) {
  const t = MENU_TEXT[locale]
  const hoursLines = summarizeOpeningHours(hours, locale)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{t.hours}</p>
      <div className={row}>
        <Clock className={icon} />
        <OpeningHoursLines lines={hoursLines} note={hours.note} noteClassName={hoursLines.length > 0 ? 'mt-1 text-xs' : 'whitespace-pre-line'} />
      </div>
    </div>
  )
}

/** The restaurant's social links, as icons or text (its choice). */
export function FooterSocial({ social, display, locale }: { social: SocialHandles; display: 'icons' | 'text'; locale: Locale }) {
  const t = MENU_TEXT[locale]
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">{t.follow}</p>
      <SocialList handles={social} display={display} />
    </div>
  )
}
