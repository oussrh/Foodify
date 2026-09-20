"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { flushSync } from 'react-dom'
import Image from 'next/image'
import { Camera, Check, Download, Search, Share2, SlidersHorizontal, Utensils, WifiOff, X } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'
import type { SocialHandles } from '@/lib/social-media'
import {
  DIETARY_OPTIONS,
  LOCALE_STORAGE_KEY,
  MENU_TEXT,
  hasAR,
  resolveInitialLocale,
  type Locale,
  type MenuCategory,
  type MenuDish,
  type MenuRestaurant,
  type Money,
} from '@/lib/menu'
import { dayName, openStatus, parseOpeningHours } from '@/lib/opening-hours'
import DishRow from './dish-row'
import DishBody from './dish-body'
import MenuFooter from './menu-footer'
import { usePwa } from './use-pwa'

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
  urlLang,
  urlFilter,
}: RestaurantPageProps) {
  // Server renders the restaurant default (or ?lang=); the guest's remembered/browser language is applied after mount.
  const [locale, setLocaleState] = useState<Locale>(urlLang === 'fr' || urlLang === 'en' ? urlLang : restaurant.defaultLocale)
  const [query, setQuery] = useState('')
  const [arOnly, setArOnly] = useState(urlFilter === 'ar')
  const [dietary, setDietary] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [openDish, setOpenDish] = useState<MenuDish | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [status, setStatus] = useState<ReturnType<typeof openStatus>>(null)
  const [transitionDishId, setTransitionDishId] = useState<string | null>(null)

  // Everything the service worker should keep so this menu opens with no signal.
  const precacheUrls = useMemo(() => {
    const img = (src: string, w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`
    const urls = [`/restaurant/${restaurant.slug}`, `/restaurant/${restaurant.slug}/manifest`]
    if (restaurant.logoUrl) urls.push(img(restaurant.logoUrl, 256))
    if (restaurant.coverImageUrl) urls.push(restaurant.coverImageUrl)
    const dishes = [...categories.flatMap((c) => c.subcategories.flatMap((s) => s.dishes)), ...uncategorizedDishes]
    for (const d of dishes) urls.push(img(d.imageUrl, 640))
    return urls
  }, [restaurant, categories, uncategorizedDishes])

  const { installPlatform, install, online, offlineReady, updateReady, applyUpdate } = usePwa({
    precacheUrls,
    onUpdate: () => window.location.reload(),
  })

  const t = MENU_TEXT[locale]
  const heroRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    if (!updateReady) return
    toast(t.updateAvailable, { duration: Infinity, action: { label: t.refresh, onClick: () => applyUpdate() } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateReady])

  const name = (en: string, fr: string) => (locale === 'fr' ? fr : en)
  const money: Money = { locale, symbol: restaurant.currencySymbol, code: restaurant.currency }

  // ---- Language: resolve once on mount, remember choices, keep <html lang> honest ----
  useEffect(() => {
    setLocaleState(resolveInitialLocale(restaurant.defaultLocale, urlLang))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  const setLocale = (next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      // storage unavailable
    }
    const url = new URL(window.location.href)
    url.searchParams.set('lang', next)
    window.history.replaceState(window.history.state, '', url)
  }

  // Open/closed uses the guest's clock, so it is computed after mount and refreshed each minute.
  useEffect(() => {
    const hours = parseOpeningHours(restaurant.openingHours)
    const tick = () => setStatus(openStatus(hours))
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [restaurant.openingHours])

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

  const totalMatches = useMemo(() => sections.reduce((n, s) => n + s.count, 0), [sections])
  const arCount = useMemo(() => {
    let n = 0
    for (const c of categories) for (const s of c.subcategories) for (const d of s.dishes) if (hasAR(d)) n++
    for (const d of uncategorizedDishes) if (hasAR(d)) n++
    return n
  }, [categories, uncategorizedDishes])

  const activeFilterCount = dietary.length + (arOnly ? 1 : 0)
  const isFiltering = activeFilterCount > 0 || query.trim().length > 0
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
    const open = () => setOpenDish(dish)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const vt = (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }).startViewTransition
    if (vt && !reduce) {
      // Shared-element morph: the row thumbnail grows into the sheet photo.
      flushSync(() => setTransitionDishId(dish.id))
      vt.call(document, () => flushSync(open)).finished.finally(() => setTransitionDishId(null))
    } else {
      open()
    }
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

  const shareMenu = async () => {
    const url = `${origin}/restaurant/${restaurant.slug}?lang=${locale}`
    try {
      if (navigator.share) await navigator.share({ title: restaurant.name, text: t.menuOf(restaurant.name), url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success(t.linkCopied)
      }
    } catch {
      // cancelled
    }
  }

  const hasResults = sections.length > 0
  const meta = [restaurant.cuisineType, restaurant.city].filter(Boolean).join(' · ')
  const themeClass = restaurant.menuTheme === 'system' ? '' : restaurant.menuTheme

  const pageStyle: CSSProperties = {
    ...(brandStyle as CSSProperties),
    ...(restaurant.fontFamily ? { fontFamily: `"${restaurant.fontFamily}", var(--font-sans), sans-serif` } : {}),
  }

  const iconButton =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-input bg-card hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring'

  return (
    <div lang={locale} className={cn('brand-scope min-h-screen bg-background text-foreground', themeClass)} style={pageStyle}>
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
      <div ref={heroRef} className="relative h-44 w-full overflow-hidden bg-muted sm:h-60 lg:h-72">
        {restaurant.coverImageUrl && restaurant.coverImageStyle === 'repeat' ? (
          <div className="absolute inset-0" style={{ backgroundImage: `url(${restaurant.coverImageUrl})`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }} />
        ) : restaurant.coverImageUrl ? (
          <Image src={restaurant.coverImageUrl} alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-brand-tint" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/15 to-transparent" />
        <button
          type="button"
          onClick={shareMenu}
          aria-label={t.shareMenu}
          className="absolute right-3 top-[calc(12px+env(safe-area-inset-top))] inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:top-[calc(16px+env(safe-area-inset-top))]"
        >
          <Share2 className="h-4 w-4" />
        </button>
        <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-5xl items-end gap-3 px-4 pb-4 sm:px-6 sm:pb-5">
          {restaurant.logoUrl ? (
            <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white sm:h-14 sm:w-14">
              <Image src={restaurant.logoUrl} alt="" fill sizes="56px" className="object-cover" />
            </span>
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white/90 text-[#1B1A17] sm:h-14 sm:w-14" aria-hidden="true">
              <Utensils className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 text-white">
            <h1 className="truncate text-2xl font-semibold leading-tight tracking-display sm:text-3xl">{restaurant.name}</h1>
            {(restaurant.tagline || meta) && (
              <p className="truncate text-[13px] text-white/85 sm:text-sm">{restaurant.tagline || meta}</p>
            )}
            {status && (
              <p role="status" className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-white/90">
                <span className={cn('h-1.5 w-1.5 rounded-full', status.open ? 'bg-[#4FB283]' : 'bg-white/60')} aria-hidden="true" />
                {status.open
                  ? `${t.openNow} · ${t.closes} ${status.closesAt}`
                  : status.opensAt
                    ? `${t.closedNow} · ${t.opens} ${status.opensAt}${status.opensOn ? ' ' + dayName(status.opensOn, locale) : ''}`
                    : t.closedNow}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky bar: search, language, filters, theme */}
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

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
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
        {sections.length > 0 && (
          <nav aria-label={t.categories} ref={chipsRef} className="scrollbar-none mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 pb-2.5 sm:px-6">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#section-${s.id}`}
                data-chip={s.id}
                onClick={(e) => {
                  e.preventDefault()
                  jumpTo(s.id)
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
        )}
      </header>

      {/* Menu */}
      <main id="menu" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-8 outline-hidden sm:px-6">
        <p className="sr-only" role="status" aria-live="polite">
          {isFiltering ? t.results(totalMatches) : ''}
        </p>
        {!hasResults ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-lg font-semibold">{t.noResults}</p>
            <p className="text-sm text-muted-foreground">{t.noResultsHint}</p>
            {isFiltering && (
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
              aria-labelledby={`heading-${section.id}`}
              ref={(el) => {
                if (el) sectionRefs.current.set(section.id, el)
                else sectionRefs.current.delete(section.id)
              }}
              className="scroll-mt-[112px] pt-6"
            >
              <div className="flex items-baseline justify-between gap-3 pb-1">
                <h2 id={`heading-${section.id}`} className="text-lg font-semibold tracking-display sm:text-xl">
                  {section.name}
                </h2>
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
                        money={money}
                        href={dishHref(dish)}
                        onOpen={showDish}
                        transitioning={transitionDishId === dish.id && openDish === null}
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
          className={cn('mx-auto w-full max-w-lg overflow-y-auto p-0 sm:rounded-t-sheet', themeClass)}
          style={brandStyle as CSSProperties}
        >
          <div lang={locale} className="brand-scope px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
            {openDish && (
              <>
                <SheetTitle className="sr-only">{locale === 'fr' ? openDish.nameFr : openDish.nameEn}</SheetTitle>
                <SheetDescription className="sr-only">{breadcrumbFor(openDish) ?? restaurant.name}</SheetDescription>
                <DishBody
                  dish={openDish}
                  locale={locale}
                  money={money}
                  photoTransition
                  breadcrumb={breadcrumbFor(openDish)}
                  shareUrl={`${origin}${dishHref(openDish)}?lang=${locale}`}
                />
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Filters sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className={cn('mx-auto w-full max-w-lg p-0 sm:rounded-t-sheet', themeClass)} style={brandStyle as CSSProperties}>
          <div lang={locale} className="brand-scope flex flex-col gap-5 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
            <SheetTitle className="text-lg font-semibold tracking-display">{t.filters}</SheetTitle>
            <SheetDescription className="sr-only">{t.dietary}</SheetDescription>

            {arCount > 0 && (
              <label className="flex items-center justify-between gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-brand" aria-hidden="true" />
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

            {installPlatform === 'prompt' && (
              <button
                type="button"
                onClick={install}
                className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left hover:bg-accent"
              >
                <Download className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{t.install}</span>
                  <span className="block text-xs text-muted-foreground">{t.installHint}</span>
                </span>
              </button>
            )}
            {installPlatform === 'ios' && (
              <p className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-medium text-foreground">{t.install}</span>
                  {t.installIos}
                </span>
              </p>
            )}
            {offlineReady && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                {t.offlineReady}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
