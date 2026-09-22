"use client"

import DishMedia from './dish-media'
import { Share2 } from 'lucide-react'
import ARLaunchButton from './ar-launch-button'
import { DishFacts, DishIngredients, DishTags } from './dish-details'
import { shareLink } from './share-link'
import { formatPrice, hasAR, type Locale, type MenuDish, type Money } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import DishOrderControl, { type DishOrder } from './cart/dish-order-control'

interface DishBodyProps {
  dish: MenuDish
  locale: Locale
  money: Money
  /** e.g. "Mains · Grills" */
  breadcrumb?: string | null
  shareUrl: string
  /** Set inside the sheet so the row thumbnail can morph into this photo */
  photoTransition?: boolean
  /** The dish page's name is its h1; in the sheet, under the menu's h1, it is an h2. */
  headingLevel?: 'h1' | 'h2'
  /** How many of this dish are in the order and the way to change that; absent when the restaurant takes no orders. */
  order?: DishOrder | undefined
}

export default function DishBody({ dish, locale, money, breadcrumb, shareUrl, photoTransition, headingLevel = 'h2', order }: DishBodyProps) {
  const Heading = headingLevel
  const t = MENU_TEXT[locale]
  const name = locale === 'fr' ? dish.nameFr : dish.nameEn
  const description = locale === 'fr' ? dish.descriptionFr : dish.descriptionEn
  const ar = hasAR(dish)

  const share = () => shareLink({ title: name, url: shareUrl }, t.linkCopied)

  return (
    <article className="flex flex-col gap-4">
      <DishMedia dish={dish} name={name} ar={ar} locale={locale} photoTransition={photoTransition} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Heading className="text-[22px] font-semibold leading-tight tracking-display">{name}</Heading>
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

      {order && <DishOrderControl dish={dish} order={order} locale={locale} money={money} />}

      {ar && <ARLaunchButton dish={dish} locale={locale} />}

      {description && <p className="text-[15px] leading-relaxed text-muted-foreground">{description}</p>}

      <DishTags dish={dish} locale={locale} />
      <DishIngredients dish={dish} locale={locale} />
      <DishFacts dish={dish} locale={locale} />
    </article>
  )
}
