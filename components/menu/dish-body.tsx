"use client"

import Image from 'next/image'
import { Camera, Share2 } from 'lucide-react'
import ARLaunchButton from './ar-launch-button'
import { DishFacts, DishIngredients, DishTags } from './dish-details'
import { shareLink } from './share-link'
import { MENU_TEXT, formatPrice, hasAR, type Locale, type MenuDish, type Money } from '@/lib/menu'

interface DishBodyProps {
  dish: MenuDish
  locale: Locale
  money: Money
  /** e.g. "Mains · Grills" */
  breadcrumb?: string | null
  shareUrl: string
  /** Set inside the sheet so the row thumbnail can morph into this photo */
  photoTransition?: boolean
}

export default function DishBody({ dish, locale, money, breadcrumb, shareUrl, photoTransition }: DishBodyProps) {
  const t = MENU_TEXT[locale]
  const name = locale === 'fr' ? dish.nameFr : dish.nameEn
  const description = locale === 'fr' ? dish.descriptionFr : dish.descriptionEn
  const ar = hasAR(dish)

  const share = () => shareLink({ title: name, url: shareUrl }, t.linkCopied)

  return (
    <article className="flex flex-col gap-4">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted" style={photoTransition ? { viewTransitionName: 'dish-photo' } : undefined}>
        <Image
          src={dish.imageUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
          priority
        />
        {ar && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-bold text-[#1B1A17]">
            <Camera className="h-3 w-3" />
            {t.ar}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold leading-tight tracking-display">{name}</h2>
          {breadcrumb && <p className="mt-0.5 text-[13px] text-muted-foreground">{breadcrumb}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="tnum text-lg font-semibold">{formatPrice(dish.price, money)}</span>
          <button
            type="button"
            onClick={share}
            aria-label={t.share}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {ar && <ARLaunchButton dish={dish} locale={locale} />}

      {description && <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>}

      <DishTags dish={dish} locale={locale} />
      <DishIngredients dish={dish} locale={locale} />
      <DishFacts dish={dish} locale={locale} />
    </article>
  )
}
