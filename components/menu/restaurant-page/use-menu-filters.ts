'use client'

import { useMemo, useState } from 'react'
import { hasAR, type Locale, type MenuCategory, type MenuDish, localName } from '@/lib/menu'

export interface Section {
  id: string
  name: string
  groups: { id: string; name: string | null; dishes: MenuDish[] }[]
  count: number
}

interface MenuFiltersInput {
  categories: MenuCategory[]
  uncategorizedDishes: MenuDish[]
  locale: Locale
  /** ?filter= from the URL (manifest shortcuts use filter=ar) */
  urlFilter?: string | null | undefined
}

interface Filter {
  arOnly: boolean
  dietary: string[]
  query: string
}

function matches(dish: MenuDish, { arOnly, dietary, query }: Filter): boolean {
  if (arOnly && !hasAR(dish)) return false
  if (dietary.length > 0 && !dietary.every((d) => dish.dietary.includes(d))) return false
  if (query.trim()) {
    const q = query.trim().toLowerCase()
    const hay = [dish.nameEn, dish.nameFr, dish.descriptionEn ?? '', dish.descriptionFr ?? ''].join(' ').toLowerCase()
    if (!hay.includes(q)) return false
  }
  return true
}

/** The categories as the menu shows them: grouped by subcategory, kept to the dishes that match. */
function sectionsFor({ categories, uncategorizedDishes, locale }: MenuFiltersInput, filter: Filter): Section[] {
  const out: Section[] = []
  for (const cat of categories) {
    const catName = localName(locale, cat.nameEn, cat.nameFr)
    const groups = cat.subcategories
      .map((sub) => {
        const subName = localName(locale, sub.nameEn, sub.nameFr)
        return {
          id: sub.id,
          // Hide the subcategory label when it just repeats the category
          name: cat.subcategories.length > 1 || subName.toLowerCase() !== catName.toLowerCase() ? subName : null,
          dishes: sub.dishes.filter((dish) => matches(dish, filter)),
        }
      })
      .filter((g) => g.dishes.length > 0)
    const count = groups.reduce((n, g) => n + g.dishes.length, 0)
    if (count > 0) out.push({ id: cat.id, name: catName, groups, count })
  }
  const other = uncategorizedDishes.filter((dish) => matches(dish, filter))
  if (other.length > 0) {
    out.push({
      id: 'other',
      name: locale === 'fr' ? 'Autres plats' : 'Other dishes',
      groups: [{ id: 'other', name: null, dishes: other }],
      count: other.length,
    })
  }
  return out
}

function countAR(categories: MenuCategory[], uncategorizedDishes: MenuDish[]): number {
  let n = 0
  for (const c of categories) for (const s of c.subcategories) for (const d of s.dishes) if (hasAR(d)) n++
  for (const d of uncategorizedDishes) if (hasAR(d)) n++
  return n
}

/**
 * The guest's filters on a menu (search, AR only, dietary) and what they leave of it: the
 * sections to render, their dish count, and how many dishes have an AR model at all.
 */
export function useMenuFilters({ categories, uncategorizedDishes, locale, urlFilter }: MenuFiltersInput) {
  const [query, setQuery] = useState('')
  const [arOnly, setArOnly] = useState(urlFilter === 'ar')
  const [dietary, setDietary] = useState<string[]>([])

  const sections = useMemo(
    () => sectionsFor({ categories, uncategorizedDishes, locale }, { arOnly, dietary, query }),
    [categories, uncategorizedDishes, locale, arOnly, dietary, query],
  )
  const totalMatches = useMemo(() => sections.reduce((n, s) => n + s.count, 0), [sections])
  const arCount = useMemo(() => countAR(categories, uncategorizedDishes), [categories, uncategorizedDishes])

  const activeFilterCount = dietary.length + (arOnly ? 1 : 0)
  const isFiltering = activeFilterCount > 0 || query.trim().length > 0
  const clearFilters = () => {
    setArOnly(false)
    setDietary([])
    setQuery('')
  }

  return { query, setQuery, arOnly, setArOnly, dietary, setDietary, sections, totalMatches, arCount, activeFilterCount, isFiltering, clearFilters }
}

export type MenuFilters = ReturnType<typeof useMenuFilters>
