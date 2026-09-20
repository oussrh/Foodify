"use client"

import { MENU_TEXT, type Locale, type MenuRestaurant } from '@/lib/menu'
import type { SocialHandles } from '@/lib/social-media'
import { hasStructuredHours, parseOpeningHours } from '@/lib/opening-hours'
import { formatAddress } from './contact-format'
import { FooterBrand, FooterContact, FooterHours, FooterSocial } from './footer-columns'

interface MenuFooterProps {
  restaurant: MenuRestaurant
  social: SocialHandles
  locale: Locale
}

export default function MenuFooter({ restaurant, social, locale }: MenuFooterProps) {
  const t = MENU_TEXT[locale]
  const address = formatAddress(restaurant)
  const hours = parseOpeningHours(restaurant.openingHours)
  const hasHours = hasStructuredHours(hours) || Boolean(hours.note)
  const hasContact = address || restaurant.phone || restaurant.email || restaurant.website
  const hasSocial = social.instagram || social.facebook || social.twitter
  const year = new Date().getFullYear()

  return (
    <footer className="mt-12 border-t border-border">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <FooterBrand restaurant={restaurant} />

        {hasContact && <FooterContact restaurant={restaurant} address={address} locale={locale} />}

        {(hasHours || hasSocial) && (
          <div className="flex flex-col gap-6">
            {hasHours && <FooterHours hours={hours} locale={locale} />}
            {hasSocial && <FooterSocial social={social} locale={locale} />}
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
