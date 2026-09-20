"use client"

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { MENU_TEXT, type Locale, type MenuDish, type MenuRestaurant } from '@/lib/menu'
import DishBody from './dish-body'

interface DishPageProps {
  dish: MenuDish
  restaurant: Pick<MenuRestaurant, 'name' | 'slug' | 'defaultLocale' | 'fontFamily' | 'currencySymbol' | 'menuTheme'>
  breadcrumb: { en: string; fr: string } | null
  brandStyle: Record<string, string>
  shareUrl: string
}

/** Full-page version of the dish sheet, for shared links and QR codes that point at one dish. */
export default function DishPage({ dish, restaurant, breadcrumb, brandStyle, shareUrl }: DishPageProps) {
  const [locale, setLocale] = useState<Locale>(restaurant.defaultLocale)
  const t = MENU_TEXT[locale]

  const style: CSSProperties = {
    ...(brandStyle as CSSProperties),
    ...(restaurant.fontFamily ? { fontFamily: `"${restaurant.fontFamily}", var(--font-sans), sans-serif` } : {}),
  }

  return (
    <div className={cn('brand-scope min-h-screen bg-background text-foreground', restaurant.menuTheme === 'system' ? '' : restaurant.menuTheme)} style={style}>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-4">
          <Link
            href={`/restaurant/${restaurant.slug}`}
            className="inline-flex h-10 items-center gap-2 rounded-md pr-3 text-sm font-medium hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="truncate">{t.backToMenu}</span>
          </Link>
          <span className="ml-auto truncate text-sm font-semibold text-muted-foreground">{restaurant.name}</span>
          <div role="group" aria-label="Language" className="flex h-10 shrink-0 rounded-md border border-input bg-card p-0.5">
            {(['en', 'fr'] as Locale[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
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
          dish={dish}
          locale={locale}
          currency={restaurant.currencySymbol}
          breadcrumb={breadcrumb ? (locale === 'fr' ? breadcrumb.fr : breadcrumb.en) : null}
          shareUrl={shareUrl}
        />
      </main>
    </div>
  )
}
