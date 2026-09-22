"use client"

import type { Ref } from 'react'
import Image from 'next/image'
import { Camera, Search, SlidersHorizontal, X } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import { type Locale, type MenuRestaurant } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import type { MenuFilters } from './use-menu-filters'

interface MenuBarProps {
  restaurant: MenuRestaurant
  locale: Locale
  onLocale: (next: Locale) => void
  filters: MenuFilters
  /** True once the hero has scrolled under the bar: the name and logo take its place. */
  collapsed: boolean
  /** The section under the reader, from the scroll-spy */
  activeSection: string | null
  /** The chips strip, so the scroll-spy can keep the active chip in view */
  chipsRef: Ref<HTMLDivElement>
  onJump: (sectionId: string) => void
  onOpenFilters: () => void
}

const iconButton =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-card hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring'

/** One chip per section, the current one filled, and the AR toggle at the end. */
function CategoryChips({ locale, filters, activeSection, chipsRef, onJump }: Pick<MenuBarProps, 'locale' | 'filters' | 'activeSection' | 'chipsRef' | 'onJump'>) {
  const t = MENU_TEXT[locale]
  const { sections, arCount, arOnly, setArOnly } = filters
  return (
    <nav aria-label={t.categories} ref={chipsRef} className="scrollbar-none mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 pb-2.5 sm:px-6">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#section-${s.id}`}
          data-chip={s.id}
          onClick={(e) => {
            e.preventDefault()
            onJump(s.id)
          }}
          aria-current={activeSection === s.id ? 'location' : undefined}
          className={cn(
            'h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium leading-[30px] transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
            activeSection === s.id
              ? 'border-foreground bg-foreground text-background'
              : 'border-border-strong bg-card text-foreground hover:bg-accent',
          )}
        >
          {s.name}
        </a>
      ))}
      {arCount > 0 && (
        <button
          type="button"
          onClick={() => setArOnly((v) => !v)}
          aria-pressed={arOnly}
          className={cn(
            'ml-auto inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
            arOnly ? 'bg-brand text-brand-on' : 'bg-brand-tint text-brand hover:opacity-90',
          )}
        >
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          {t.ar} · {arCount}
        </button>
      )}
    </nav>
  )
}

/** The sticky bar: search, language, filters, theme, then the category chips. */
export default function MenuBar({ restaurant, locale, onLocale, filters, collapsed, activeSection, chipsRef, onJump, onOpenFilters }: MenuBarProps) {
  const t = MENU_TEXT[locale]
  const { query, setQuery, activeFilterCount, sections } = filters

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm supports-backdrop-filter:bg-background/85">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6">
        {collapsed && restaurant.logoUrl && (
          <span className="relative hidden h-8 w-8 shrink-0 overflow-hidden rounded-md sm:block" aria-hidden="true">
            <Image src={restaurant.logoUrl} alt="" fill sizes="32px" className="object-cover" />
          </span>
        )}
        {collapsed && <span className="hidden max-w-[24%] truncate text-sm font-semibold sm:block">{restaurant.name}</span>}
        <label className="relative flex h-10 min-w-0 flex-1 items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            enterKeyHint="search"
            className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t.clear}
              className="absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </label>

        <div role="group" aria-label="Language / Langue" className="flex h-10 shrink-0 rounded-md border border-input bg-card p-0.5">
          {(['en', 'fr'] as Locale[]).map((l) => (
            <button
              key={l}
              type="button"
              lang={l}
              onClick={() => onLocale(l)}
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

        <button
          type="button"
          onClick={onOpenFilters}
          aria-label={t.filters}
          aria-haspopup="dialog"
          className={cn(iconButton, 'relative', activeFilterCount > 0 && 'border-brand text-brand')}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="tnum absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-on">
              {activeFilterCount}
            </span>
          )}
        </button>

        {restaurant.menuTheme === 'system' && <ThemeToggle variant="outline" className="h-10 w-10 shrink-0" />}
      </div>

      {/* Category chips */}
      {sections.length > 0 && <CategoryChips locale={locale} filters={filters} activeSection={activeSection} chipsRef={chipsRef} onJump={onJump} />}
    </header>
  )
}
