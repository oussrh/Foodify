"use client"

import type { CSSProperties } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { localName, type Locale, type MenuCategory, type MenuDish, type MenuRestaurant, type Money } from '@/lib/menu'
import DishBody from '../dish-body'
import { dishHref } from './menu-urls'

interface DishSheetProps {
  dish: MenuDish | null
  onClose: () => void
  restaurant: MenuRestaurant
  categories: MenuCategory[]
  locale: Locale
  money: Money
  /** Absolute origin used to build share links, e.g. https://foodify.app */
  origin: string
  /** '' when the menu follows the device; the forced theme's class otherwise */
  themeClass: string
  brandStyle: Record<string, string>
}

/** "Mains · Grills": where the dish sits in the menu, or null when it is uncategorized. */
function breadcrumbFor(categories: MenuCategory[], dish: MenuDish, locale: Locale): string | null {
  for (const cat of categories) {
    for (const sub of cat.subcategories) {
      if (sub.dishes.some((d) => d.id === dish.id)) {
        const c = localName(locale, cat.nameEn, cat.nameFr)
        const s = localName(locale, sub.nameEn, sub.nameFr)
        return s.toLowerCase() === c.toLowerCase() ? c : `${c} · ${s}`
      }
    }
  }
  return null
}

/** The bottom sheet a row opens: the dish in full, in the restaurant's brand and theme. */
export default function DishSheet({ dish, onClose, restaurant, categories, locale, money, origin, themeClass, brandStyle }: DishSheetProps) {
  const breadcrumb = dish && breadcrumbFor(categories, dish, locale)
  return (
    <Sheet open={dish !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className={cn('mx-auto w-full max-w-lg overflow-y-auto p-0 sm:rounded-t-sheet', themeClass)}
        style={brandStyle as CSSProperties}
      >
        <div lang={locale} className="brand-scope px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
          {dish && (
            <>
              <SheetTitle className="sr-only">{locale === 'fr' ? dish.nameFr : dish.nameEn}</SheetTitle>
              <SheetDescription className="sr-only">{breadcrumb ?? restaurant.name}</SheetDescription>
              <DishBody
                dish={dish}
                locale={locale}
                money={money}
                photoTransition
                breadcrumb={breadcrumb}
                shareUrl={`${origin}${dishHref(restaurant.slug, dish)}?lang=${locale}`}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
