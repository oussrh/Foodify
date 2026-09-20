"use client"

import { useEffect, useState, type Ref } from 'react'
import Image from 'next/image'
import { Share2, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MENU_TEXT, type Locale, type MenuRestaurant } from '@/lib/menu'
import { dayName, openStatus, parseOpeningHours, type OpenStatus } from '@/lib/opening-hours'
import { shareLink } from '../share-link'

interface MenuHeroProps {
  restaurant: MenuRestaurant
  locale: Locale
  /** Absolute origin used to build share links, e.g. https://foodify.app */
  origin: string
  /** Observed by the scroll-spy: the bar collapses once the hero is out of view. */
  ref: Ref<HTMLDivElement>
}

/** "Open now · closes 22:00", or when it opens next. */
function OpenStatusLine({ status, locale }: { status: OpenStatus; locale: Locale }) {
  const t = MENU_TEXT[locale]
  return (
    <p role="status" className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-white/90">
      <span className={cn('h-1.5 w-1.5 rounded-full', status.open ? 'bg-[#4FB283]' : 'bg-white/60')} aria-hidden="true" />
      {status.open
        ? `${t.openNow} · ${t.closes} ${status.closesAt}`
        : status.opensAt
          ? `${t.closedNow} · ${t.opens} ${status.opensAt}${status.opensOn ? ' ' + dayName(status.opensOn, locale) : ''}`
          : t.closedNow}
    </p>
  )
}

/** The restaurant's photo, logo, name and whether it is open right now; then it gets out of the way. */
export default function MenuHero({ restaurant, locale, origin, ref }: MenuHeroProps) {
  const t = MENU_TEXT[locale]
  const [status, setStatus] = useState<OpenStatus | null>(null)

  // Open/closed uses the guest's clock, so it is computed after mount and refreshed each minute.
  useEffect(() => {
    const hours = parseOpeningHours(restaurant.openingHours)
    const tick = () => setStatus(openStatus(hours))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [restaurant.openingHours])

  const shareMenu = () =>
    shareLink({ title: restaurant.name, text: t.menuOf(restaurant.name), url: `${origin}/restaurant/${restaurant.slug}?lang=${locale}` }, t.linkCopied)

  const meta = [restaurant.cuisineType, restaurant.city].filter(Boolean).join(' · ')

  return (
    <div ref={ref} className="relative h-44 w-full overflow-hidden bg-muted sm:h-60 lg:h-72">
      {restaurant.coverImageUrl && restaurant.coverImageStyle === 'repeat' ? (
        <div className="absolute inset-0" style={{ backgroundImage: `url(${restaurant.coverImageUrl})`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }} />
      ) : restaurant.coverImageUrl ? (
        <Image src={restaurant.coverImageUrl} alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-brand-tint" />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
      <button
        type="button"
        onClick={shareMenu}
        aria-label={t.shareMenu}
        className="absolute right-3 top-[calc(12px+env(safe-area-inset-top))] inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-[calc(16px+env(safe-area-inset-top))]"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-5xl items-end gap-3 px-4 pb-4 sm:px-6 sm:pb-5">
        {restaurant.logoUrl ? (
          <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white sm:h-14 sm:w-14">
            <Image src={restaurant.logoUrl} alt="" fill sizes="56px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/90 text-[#1B1A17] sm:h-14 sm:w-14" aria-hidden="true">
            <Utensils className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0 text-white">
          <h1 className="truncate text-2xl font-semibold leading-tight tracking-display sm:text-3xl">{restaurant.name}</h1>
          {(restaurant.tagline || meta) && (
            <p className="truncate text-[13px] text-white/85 sm:text-sm">{restaurant.tagline || meta}</p>
          )}
          {status && <OpenStatusLine status={status} locale={locale} />}
        </div>
      </div>
    </div>
  )
}
