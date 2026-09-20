"use client"

import { MENU_TEXT, type Locale, type MenuDish, type Money } from '@/lib/menu'
import DishRow from '../dish-row'
import { dishHref } from './menu-urls'
import type { MenuFilters } from './use-menu-filters'

interface MenuSectionsProps {
  slug: string
  locale: Locale
  money: Money
  filters: MenuFilters
  onOpen: (dish: MenuDish) => void
  /** The row whose thumbnail is morphing into the sheet photo */
  transitioningDishId: string | null
}

/** The menu itself: one section per category with its dishes, or the empty state when nothing matches. */
export default function MenuSections({ slug, locale, money, filters, onOpen, transitioningDishId }: MenuSectionsProps) {
  const t = MENU_TEXT[locale]
  const { sections, totalMatches, isFiltering, clearFilters } = filters
  const hasResults = sections.length > 0

  return (
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
                      href={dishHref(slug, dish)}
                      onOpen={onOpen}
                      transitioning={transitioningDishId === dish.id}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}
    </main>
  )
}
