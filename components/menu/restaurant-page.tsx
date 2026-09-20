"use client"

import { useEffect, useEffectEvent, useMemo, useState, type CSSProperties } from 'react'
import { useMenuLocale } from './use-menu-locale'
import { useClientValue } from '@/components/use-client-value'
import { WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SocialHandles } from '@/lib/social-media'
import { MENU_TEXT, type Locale, type MenuCategory, type MenuDish, type MenuRestaurant, type Money } from '@/lib/menu'
import MenuFooter from './menu-footer'
import { usePwa } from './use-pwa'
import MenuHero from './restaurant-page/menu-hero'
import MenuBar from './restaurant-page/menu-bar'
import MenuSections from './restaurant-page/menu-sections'
import DishSheet from './restaurant-page/dish-sheet'
import FiltersSheet from './restaurant-page/filters-sheet'
import { precacheUrls } from './restaurant-page/menu-urls'
import { useMenuFilters } from './restaurant-page/use-menu-filters'
import { useScrollSpy } from './restaurant-page/use-scroll-spy'
import { useDishSheet } from './restaurant-page/use-dish-sheet'

interface RestaurantPageProps {
  restaurant: MenuRestaurant
  categories: MenuCategory[]
  uncategorizedDishes: MenuDish[]
  social: SocialHandles
  brandStyle: Record<string, string>
  /** Absolute origin used to build share links, e.g. https://foodify.app */
  origin: string
  /** ?lang= from the URL, if any */
  urlLang?: string | null
  /** ?filter= from the URL (manifest shortcuts use filter=ar) */
  urlFilter?: string | null
}

export default function RestaurantPage({
  restaurant,
  categories,
  uncategorizedDishes,
  social,
  brandStyle,
  origin,
  urlLang,
  urlFilter,
}: RestaurantPageProps) {
  const [locale, chooseLocale] = useMenuLocale(restaurant.defaultLocale, urlLang)
  // Rendered only after hydration: the rows are plain links until React attaches to them, and the
  // browser suite waits for this before it clicks.
  const hydrated = useClientValue(() => true, false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const urls = useMemo(() => precacheUrls(restaurant, categories, uncategorizedDishes), [restaurant, categories, uncategorizedDishes])
  const { installPlatform, install, online, offlineReady, updateReady, applyUpdate } = usePwa({
    precacheUrls: urls,
    onUpdate: () => window.location.reload(),
  })

  const t = MENU_TEXT[locale]

  // The offer is made once per waiting version, in the language of that moment.
  const offerUpdate = useEffectEvent(() => toast(t.updateAvailable, { duration: Infinity, action: { label: t.refresh, onClick: () => applyUpdate() } }))
  useEffect(() => {
    if (updateReady) offerUpdate()
  }, [updateReady])

  const money: Money = { locale, symbol: restaurant.currencySymbol, code: restaurant.currency }

  // ---- Language: remember choices, keep <html lang> honest ----
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  const setLocale = (next: Locale) => {
    chooseLocale(next)
    const url = new URL(window.location.href)
    url.searchParams.set('lang', next)
    window.history.replaceState(window.history.state, '', url)
  }

  const filters = useMenuFilters({ categories, uncategorizedDishes, locale, urlFilter })
  const { heroRef, chipsRef, activeSection, collapsed, jumpTo } = useScrollSpy(filters.sections)
  const sheet = useDishSheet()

  const themeClass = restaurant.menuTheme === 'system' ? '' : restaurant.menuTheme
  const pageStyle: CSSProperties = {
    ...(brandStyle as CSSProperties),
    ...(restaurant.fontFamily ? { fontFamily: `"${restaurant.fontFamily}", var(--font-sans), sans-serif` } : {}),
  }

  return (
    <div lang={locale} data-hydrated={hydrated || undefined} className={cn('brand-scope min-h-screen bg-background text-foreground', themeClass)} style={pageStyle}>
      <a
        href="#menu"
        className="sr-only z-50 rounded-md bg-foreground px-3 py-2 text-sm font-semibold text-background focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        {t.skipToMenu}
      </a>

      {!online && (
        <div role="status" className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-2 text-center text-xs font-medium text-warning">
          <WifiOff className="h-3.5 w-3.5" />
          {t.offline}
        </div>
      )}

      {/* Hero: the restaurant's photo and name, then it gets out of the way */}
      <MenuHero ref={heroRef} restaurant={restaurant} locale={locale} origin={origin} />

      {/* Sticky bar: search, language, filters, theme */}
      <MenuBar
        restaurant={restaurant}
        locale={locale}
        onLocale={setLocale}
        filters={filters}
        collapsed={collapsed}
        activeSection={activeSection}
        chipsRef={chipsRef}
        onJump={jumpTo}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      {/* Menu */}
      <MenuSections slug={restaurant.slug} locale={locale} money={money} filters={filters} onOpen={sheet.showDish} transitioningDishId={sheet.rowTransitionId} />

      <MenuFooter restaurant={restaurant} social={social} locale={locale} />

      {/* Dish sheet */}
      <DishSheet
        dish={sheet.openDish}
        onClose={sheet.hideDish}
        restaurant={restaurant}
        categories={categories}
        locale={locale}
        money={money}
        origin={origin}
        themeClass={themeClass}
        brandStyle={brandStyle}
      />

      {/* Filters sheet */}
      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        locale={locale}
        themeClass={themeClass}
        brandStyle={brandStyle}
        installPlatform={installPlatform}
        onInstall={install}
        offlineReady={offlineReady}
      />
    </div>
  )
}
