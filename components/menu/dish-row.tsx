"use client"

import DishPhoto from '@/components/menu/dish-photo'
import { SoldOutMark } from '@/components/menu/sold-out-mark'
import { DishTags } from '@/components/menu/dish-tags'
import { Camera } from 'lucide-react'
import { formatPrice, hasAR, type Locale, type MenuDish, type Money } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import AddButton from './cart/add-button'

interface DishRowProps {
  dish: MenuDish
  locale: Locale
  money: Money
  href: string
  onOpen: (dish: MenuDish) => void
  /** Names the thumbnail for the shared-element transition into the sheet */
  transitioning?: boolean
  /** How many of this dish are in the order, and the way to add one; absent when the restaurant takes no orders. */
  order?: { quantity: number; onAdd: () => void } | undefined
}

/** One menu line: photo, name, one line of description, price. Dense on purpose. */
export default function DishRow({ dish, locale, money, href, onOpen, transitioning, order }: DishRowProps) {
  const t = MENU_TEXT[locale]
  const name = locale === 'fr' ? dish.nameFr : dish.nameEn
  const description = locale === 'fr' ? dish.descriptionFr : dish.descriptionEn
  const tags = dish.dietary.slice(0, 2)

  return (
    <li className="flex items-center gap-2 border-b border-border last:border-b-0">
      <a
        href={href}
        onClick={(e) => {
          // Plain left-click opens the sheet; modifier clicks keep the real link.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
          e.preventDefault()
          onOpen(dish)
        }}
        className="grid min-w-0 flex-1 grid-cols-[76px_1fr_auto] items-center gap-3 py-3 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <span className="relative block h-[76px] w-[76px] overflow-hidden rounded-md bg-muted" style={transitioning ? { viewTransitionName: 'dish-photo' } : undefined}>
          <DishPhoto src={dish.imageUrl} alt="" sizes="76px" iconClassName="h-6 w-6" />
          {dish.soldOut && <SoldOutMark locale={locale} />}
          {!dish.soldOut && hasAR(dish) && (
            <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-white/92 px-1.5 py-0.5 text-[10px] font-bold text-[#1B1A17]">
              <Camera className="h-2.5 w-2.5" />
              {t.ar}
            </span>
          )}
        </span>

        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold leading-snug">{name}</span>
          {description && <span className="truncate text-[13px] text-muted-foreground">{description}</span>}
          <DishTags dish={dish} tags={tags} locale={locale} />
        </span>

        <span className="tnum self-start pt-0.5 text-[15px] font-semibold">{formatPrice(dish.price, money)}</span>
      </a>

      {/* Nothing to add: the kitchen has run out, and the endpoint refuses it too. */}
      {order && !dish.soldOut && <AddButton name={name} quantity={order.quantity} onAdd={order.onAdd} locale={locale} />}
    </li>
  )
}
