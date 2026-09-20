"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { Camera, Search, SlidersHorizontal, Utensils, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import type { SocialHandles } from '@/lib/social-media'
import {
  DIETARY_OPTIONS,
  MENU_TEXT,
  hasAR,
  type Locale,
  type MenuCategory,
  type MenuDish,
  type MenuRestaurant,
} from '@/lib/menu'
import DishRow from './dish-row'
import DishBody from './dish-body'
import MenuFooter from './menu-footer'

interface RestaurantPageProps {
  restaurant: MenuRestaurant
  categories: MenuCategory[]
  uncategorizedDishes: MenuDish[]
  social: SocialHandles
  brandStyle: Record<string, string>
  /** Absolute origin used to build share links, e.g. https://foodify.app */
  origin: string
}

interface Section {
  id: string
  name: string
  groups: { id: string; name: string | null; dishes: MenuDish[] }[]
  count: number
}

const BAR_HEIGHT = 56
const CHIPS_HEIGHT = 50

export default function RestaurantPage({
  restaurant,
  categories,
  uncategorizedDishes,
  social,
  brandStyle,
  origin,
}: RestaurantPageProps) {
  const [locale, setLocale] = useState<Locale>(restaurant.defaultLocale)
  const [query, setQuery] = useState('')
  const [arOnly, setArOnly] = useState(false)
  const [dietary, setDietary] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openDish, setOpenDish] = useState<MenuDish | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  const t = MENU_TEXT[locale]
  const heroRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  const name = (en: string, fr: string) => (locale === 'fr' ? fr : en)

  // ---- Filtering -------------------------------------------------------------
  const matches = useCallback(
    (dish: MenuDish) => {
      if (arOnly && !hasAR(dish)) return false
      if (dietary.length > 0 && !dietary.every((d) => dish.dietary.includes(d))) return false
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        const hay = [dish.nameEn, dish.nameFr, dish.descriptionEn ?? '', dish.descriptionFr ?? ''].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    },
    [arOnly, dietary, query],
  )

  const sections = useMemo<Section[]>(() => {
    const out: Section[] = []
    for (const cat of categories) {
      const catName = name(cat.nameEn, cat.nameFr)
      const groups = cat.subcategories
        .map((sub) => {
          const subName = name(sub.nameEn, sub.nameFr)
          return {
            id: sub.id,
            // Hide the subcategory label when it just repeats the category
            name: cat.subcategories.length > 1 || subName.toLowerCase() !== catName.toLowerCase() ? subName : null,
            dishes: sub.dishes.filter(matches),
          }
        })
        .filter((g) => g.dishes.length > 0)
      const count = groups.reduce((n, g) => n + g.dishes.length, 0)
      if (count > 0) out.push({ id: cat.id, name: catName, groups, count })
    }
    const other = uncategorizedDishes.filter(matches)
    if (other.length > 0) {
      out.push({
        id: 'other',
        name: locale === 'fr' ? 'Autres plats' : 'Other dishes',
        groups: [{ id: 'other', name: null, dishes: other }],
        count: other.length,
      })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, uncategorizedDishes, matches, locale])

  const arCount = useMemo(() => {
    let n = 0
    for (const c of categories) for (const s of c.subcategories) for (const d of s.dishes) if (hasAR(d)) n++
    for (const d of uncategorizedDishes) if (hasAR(d)) n++
    return n
  }, [categories, uncategorizedDishes])

  const activeFilterCount = dietary.length + (arOnly ? 1 : 0)
  const clearFilters = () => {
    setArOnly(false)
    setDietary([])
    setQuery('')
  }

  // ---- Hero collapse + scroll-spy ---------------------------------------------
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return
    const io = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), {
      rootMargin: `-${BAR_HEIGHT}px 0px 0px 0px`,
      threshold: 0,
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const line = BAR_HEIGHT + CHIPS_HEIGHT + 12
        let current: string | null = null
        for (const s of sections) {
          const el = sectionRefs.current.get(s.id)
          if (el && el.getBoundingClientRect().top <= line) current = s.id
        }
        setActiveSection(current ?? sections[0]?.id ?? null)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [sections])

  // Keep the active chip in view as the reader scrolls
  useEffect(() => {
    if (!activeSection || !chipsRef.current) return
    const chip = chipsRef.current.querySelector<HTMLElement>(`[data-chip="${activeSection}"]`)
    chip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [activeSection])

  const jumpTo = (id: string) => {
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ---- Dish sheet, with the back button closing it ----------------------------
  useEffect(() => {
    const onPop = () => setOpenDish(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const showDish = (dish: MenuDish) => {
    setOpenDish(dish)
    try {
      window.history.pushState({ foodifyDish: dish.id }, '')
    } catch {
      // history may be unavailable in some embedded browsers
    }
  }
  const hideDish = () => {
    if (typeof window !== 'undefined' && window.history.state?.foodifyDish) window.history.back()
    else setOpenDish(null)
  }

  const dishHref = (dish: MenuDish) => `/restaurant/${restaurant.slug}/dish/${dish.id}`
  const breadcrumbFor = (dish: MenuDish): string | null => {
    for (const cat of categories) {
      for (const sub of cat.subcategories) {
        if (sub.dishes.some((d) => d.id === dish.id)) {
          const c = name(cat.nameEn, cat.nameFr)
          const s = name(sub.nameEn, sub.nameFr)
          return s.toLowerCase() === c.toLowerCase() ? c : `${c} · ${s}`
        }
      }
    }
    return null
  }

  const hasResults = sections.length > 0
  const meta = [restaurant.cuisineType, restaurant.city].filter(Boolean).join(' · ')

  const pageStyle: CSSProperties = {
    ...(brandStyle as CSSProperties),
    ...(restaurant.fontFamily ? { fontFamily: `"${restaurant.fontFamily}", var(--font-sans), sans-serif` } : {}),
  }

  return (
    <div className="brand-scope min-h-screen bg-background text-foreground" style={pageStyle}>
      {/* Hero: the restaurant's photo and name, then it gets out of the way */}
      <div ref={heroRef} className="relative h-44 w-full overflow-hidden bg-muted sm:h-60 lg:h-72">
        {restaurant.coverImageUrl ? (
          <Image src={restaurant.coverImageUrl} alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-brand-tint" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-5xl items-end gap-3 px-4 pb-4 sm:px-6 sm:pb-5">
          {restaurant.logoUrl ? (
            <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white sm:h-14 sm:w-14">
              <Image src={restaurant.logoUrl} alt="" fill sizes="56px" className="object-cover" />
            </span>
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/90 text-[#1B1A17] sm:h-14 sm:w-14">
              <Utensils className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 text-white">
            <h1 className="truncate text-2xl font-semibold leading-tight tracking-display sm:text-3xl">{restaurant.name}</h1>
            {(restaurant.tagline || meta) && (
              <p className="truncate text-[13px] text-white/85 sm:text-sm">{restaurant.tagline || meta}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bar: search, language, filters, theme */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4 sm:px-6">
          {collapsed && (
            <span className="hidden max-w-[28%] truncate text-sm font-semibold sm:block">{restaurant.name}</span>
          )}
          <label className="relative flex h-10 min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              aria-label={t.search}
              className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-8 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label={t.filters}
            className={cn(
              'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-card hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeFilterCount > 0 && 'border-brand text-brand',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <span className="tnum absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-brand-on">
                {activeFilterCount}
              </span>
            )}
          </button>

          <ThemeToggle variant="outline" className="h-10 w-10 shrink-0" />
        </div>

        {/* Category chips */}
        {sections.length > 0 && (
          <div ref={chipsRef} className="scrollbar-none mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 pb-2.5 sm:px-6">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                data-chip={s.id}
                onClick={() => jumpTo(s.id)}
                aria-current={activeSection === s.id ? 'true' : undefined}
                className={cn(
                  'h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-[13px] font-medium transition-colors',
                  activeSection === s.id
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border-strong bg-card text-foreground hover:bg-accent',
                )}
              >
                {s.name}
              </button>
            ))}
            {arCount > 0 && (
              <button
                type="button"
                onClick={() => setArOnly((v) => !v)}
                aria-pressed={arOnly}
                className={cn(
                  'ml-auto inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition-colors',
                  arOnly ? 'bg-brand text-brand-on' : 'bg-brand-tint text-brand hover:opacity-90',
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                {t.ar} · {arCount}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Menu */}
      <main className="mx-auto max-w-5xl px-4 pb-8 sm:px-6">
        {!hasResults ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-lg font-semibold">{t.noResults}</p>
            <p className="text-sm text-muted-foreground">{t.noResultsHint}</p>
            {(activeFilterCount > 0 || query) && (
              <button type="button" onClick={clearFilters} className="mt-2 text-sm font-medium text-brand hover:underline">
                {t.clear}
              </button>
            )}
          </div>
        ) : (
          sections.map((section) => (
            <section
              key={section.id}
              id={`section-${section.id}`}
              ref={(el) => {
                if (el) sectionRefs.current.set(section.id, el)
                else sectionRefs.current.delete(section.id)
              }}
              className="scroll-mt-[112px] pt-6"
            >
              <div className="flex items-baseline justify-between gap-3 pb-1">
                <h2 className="text-lg font-semibold tracking-display sm:text-xl">{section.name}</h2>
                <span className="tnum text-xs text-muted-foreground">
                  {section.count} {section.count === 1 ? t.dish : t.dishes}
                </span>
              </div>
              {section.groups.map((group) => (
                <div key={group.id}>
                  {group.name && <h3 className="pb-1 pt-3 text-xs font-medium text-muted-foreground">{group.name}</h3>}
                  <ul className="md:grid md:grid-cols-2 md:gap-x-8 xl:grid-cols-3">
                    {group.dishes.map((dish) => (
                      <DishRow
                        key={dish.id}
                        dish={dish}
                        locale={locale}
                        currency={restaurant.currencySymbol}
                        href={dishHref(dish)}
                        onOpen={showDish}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))
        )}
      </main>

      <MenuFooter restaurant={restaurant} social={social} locale={locale} />

      {/* Dish sheet */}
      <Sheet open={openDish !== null} onOpenChange={(open) => !open && hideDish()}>
        <SheetContent
          side="bottom"
          className="mx-auto w-full max-w-lg overflow-y-auto p-0 sm:rounded-t-sheet"
          style={brandStyle as CSSProperties}
        >
          <div className="brand-scope px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
            {openDish && (
              <>
                <SheetTitle className="sr-only">{locale === 'fr' ? openDish.nameFr : openDish.nameEn}</SheetTitle>
                <DishBody
                  dish={openDish}
                  locale={locale}
                  currency={restaurant.currencySymbol}
                  breadcrumb={breadcrumbFor(openDish)}
                  shareUrl={`${origin}${dishHref(openDish)}`}
                />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Filters sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="mx-auto w-full max-w-lg p-0 sm:rounded-t-sheet" style={brandStyle as CSSProperties}>
          <div className="brand-scope flex flex-col gap-5 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
            <SheetTitle className="text-lg font-semibold tracking-display">{t.filters}</SheetTitle>

            {arCount > 0 && (
              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-brand" />
                  {t.arOnly}
                </span>
                <Switch checked={arOnly} onCheckedChange={setArOnly} />
              </label>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">{t.dietary}</span>
              <div className="flex flex-wrap gap-1.5">
                {DIETARY_OPTIONS.map((opt) => {
                  const on = dietary.includes(opt.key)
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setDietary((d) => (on ? d.filter((k) => k !== opt.key) : [...d, opt.key]))}
                      className={cn(
                        'h-8 rounded-full border px-3 text-[13px] font-medium transition-colors',
                        on ? 'border-brand bg-brand text-brand-on' : 'border-border-strong bg-card hover:bg-accent',
                      )}
                    >
                      {opt[locale]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setArOnly(false)
                  setDietary([])
                }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {t.clear}
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-5 text-sm font-semibold text-background"
              >
                {t.done}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
