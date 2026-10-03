// components/menu/menu-sub-page.tsx
// A menu page that is not the menu itself (a dish opened from a shared link, a guest's order), in
// the restaurant's brand, font and theme like the menu: the bar across the top with the way back,
// the restaurant's name, the language switch and the theme toggle when the restaurant leaves the
// theme to the device, then the page's own content in the guest's language.
'use client'

import { useEffect, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { type Locale, type MenuRestaurant } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import LanguageSwitch from './language-switch'
import { useMenuLocale } from './use-menu-locale'

/** What the shell reads of the restaurant. */
export type SubPageRestaurant = Pick<MenuRestaurant, 'slug' | 'name' | 'defaultLocale' | 'fontFamily' | 'menuTheme'>

interface HeaderProps {
  slug: string
  name: string
  locale: Locale
  onLocale: (locale: Locale) => void
  themeToggle: boolean
}

/** The sticky bar: back to the menu, the restaurant, the language and the theme. */
function MenuPageHeader({ slug, name, locale, onLocale, themeToggle }: HeaderProps) {
  const t = MENU_TEXT[locale]
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-lg items-center gap-2 px-4">
        <Link
          href={`/restaurant/${slug}?lang=${locale}`}
          className="inline-flex h-10 items-center gap-2 rounded-md pr-3 text-sm font-medium hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">{t.backToMenu}</span>
        </Link>
        <span className="ml-auto truncate text-sm font-semibold text-muted-foreground">{name}</span>
        <LanguageSwitch locale={locale} onLocale={onLocale} />
        {themeToggle && <ThemeToggle variant="outline" className="h-10 w-10 shrink-0" />}
      </div>
    </header>
  )
}

interface MenuSubPageProps {
  restaurant: SubPageRestaurant
  brandStyle: Record<string, string>
  /** ?lang= from the URL, if any */
  urlLang?: string | null | undefined
  /** The page's content, in the language the guest is reading. */
  children: (locale: Locale) => ReactNode
}

/** A menu sub-page in the restaurant's brand scope: the top bar, then `children` in the guest's language. */
export default function MenuSubPage({ restaurant, brandStyle, urlLang, children }: MenuSubPageProps) {
  const [locale, setLocale] = useMenuLocale(restaurant.defaultLocale, urlLang)
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
      <MenuPageHeader slug={restaurant.slug} name={restaurant.name} locale={locale} onLocale={setLocale} themeToggle={restaurant.menuTheme === 'system'} />
      <main className="mx-auto max-w-lg px-4 py-4 pb-[max(24px,env(safe-area-inset-bottom))]">{children(locale)}</main>
    </div>
  )
}
