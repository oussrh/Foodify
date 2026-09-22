"use client"

import { useEffect, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { type Locale, type MenuDish, type MenuRestaurant, type Money } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import { useMenuLocale } from './use-menu-locale'
import { useCart } from './cart/use-cart'
import DishBody from './dish-body'
import { useDishView } from './use-dish-view'

interface DishPageProps {
  dish: MenuDish
  restaurant: Pick<MenuRestaurant, 'id' | 'name' | 'slug' | 'defaultLocale' | 'fontFamily' | 'currencySymbol' | 'currency' | 'menuTheme' | 'orderingEnabled'>
  breadcrumb: { en: string; fr: string } | null
  brandStyle: Record<string, string>
  shareUrl: string
  urlLang?: string | null
}

/** Full-page version of the dish sheet, for shared links and QR codes that point at one dish. */
export default function DishPage({ dish, restaurant, breadcrumb, brandStyle, shareUrl, urlLang }: DishPageProps) {
  useDishView(dish.id)
  const [locale, setLocale] = useMenuLocale(restaurant.defaultLocale, urlLang)
  const t = MENU_TEXT[locale]
  // The same cart as the menu's, so a dish added from a shared link is in the order there too.
  const cart = useCart(restaurant.id)
  const money: Money = { locale, symbol: restaurant.currencySymbol, code: restaurant.currency }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  const style: CSSProperties = {
    ...(brandStyle as CSSProperties),
    ...(restaurant.fontFamily ? { fontFamily: `"${restaurant.fontFamily}", var(--font-sans), sans-serif` } : {}),
  }

  return (
    <div
      lang={locale}
      className={cn('brand-scope min-h-screen bg-background text-foreground', restaurant.menuTheme === 'system' ? '' : restaurant.menuTheme)}
      style={style}
    >
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-4">
          <Link
            href={`/restaurant/${restaurant.slug}?lang=${locale}`}
            className="inline-flex h-10 items-center gap-2 rounded-md pr-3 text-sm font-medium hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">{t.backToMenu}</span>
          </Link>
          <span className="ml-auto truncate text-sm font-semibold text-muted-foreground">{restaurant.name}</span>
          <div role="group" aria-label="Language / Langue" className="flex h-10 shrink-0 rounded-md border border-input bg-card p-0.5">
            {(['en', 'fr'] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                lang={l}
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                aria-label={l === 'en' ? 'English' : 'Français'}
                className={cn(
                  'rounded-[4px] px-2.5 text-xs font-semibold uppercase transition-colors',
                  locale === l ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {l}
              </button>
            ))}
          </div>
          {restaurant.menuTheme === 'system' && <ThemeToggle variant="outline" className="h-10 w-10 shrink-0" />}
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <DishBody
          headingLevel="h1"
          dish={dish}
          locale={locale}
          money={money}
          breadcrumb={breadcrumb ? (locale === 'fr' ? breadcrumb.fr : breadcrumb.en) : null}
          shareUrl={shareUrl}
          order={
            // Sold out for the rest of the service: nothing to add, here or at the endpoint.
            restaurant.orderingEnabled && !dish.soldOut
              ? {
                  quantity: cart.quantityOf(dish.id),
                  onChange: (quantity) => cart.setQuantity(dish.id, quantity),
                  note: cart.noteOf(dish.id),
                  onNote: (note) => cart.setNote(dish.id, note),
                }
              : undefined
          }
        />
      </main>
    </div>
  )
}
