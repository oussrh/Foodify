// components/waiter/waiter-menu.tsx
// The menu as a waiter uses it: standing up, one-handed, with a guest waiting. Two things make
// that bearable on a long menu — a search box that filters as you type, because a waiter knows
// the dish's name and should not have to scroll to it, and a row of category chips that jumps
// straight to a section. Both beat scrolling past forty dishes to reach the desserts.
'use client'

import { useMemo, useState } from 'react'
import { Minus, Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatPrice, localName, type Locale, type MenuCategory, type MenuDish, type Money } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import { cn } from '@/lib/utils'

interface WaiterMenuProps {
  categories: MenuCategory[]
  loose: MenuDish[]
  money: Money
  locale: Locale
  quantityOf: (dishId: string) => number
  onAdd: (dishId: string) => void
  onQuantity: (dishId: string, quantity: number) => void
}

interface Section {
  id: string
  name: string
  dishes: MenuDish[]
}

export function WaiterMenu({ categories, loose, money, locale, quantityOf, onAdd, onQuantity }: WaiterMenuProps) {
  const [query, setQuery] = useState('')
  const name = (dish: MenuDish) => localName(locale, dish.nameEn, dish.nameFr)

  const sections = useMemo<Section[]>(() => {
    const all: Section[] = categories.map((category) => ({
      id: category.id,
      name: localName(locale, category.nameEn, category.nameFr),
      dishes: category.subcategories.flatMap((sub) => sub.dishes),
    }))
    if (loose.length > 0) all.push({ id: 'loose', name: localName(locale, 'Other', 'Autres'), dishes: loose })

    const needle = query.trim().toLowerCase()
    if (!needle) return all.filter((section) => section.dishes.length > 0)
    // Both languages, because a waiter types whichever name is in their head.
    return all
      .map((section) => ({
        ...section,
        dishes: section.dishes.filter((dish) => `${dish.nameEn} ${dish.nameFr}`.toLowerCase().includes(needle)),
      }))
      .filter((section) => section.dishes.length > 0)
  }, [categories, loose, locale, query])

  const found = sections.reduce((n, section) => n + section.dishes.length, 0)

  return (
    <>
      <div className="sticky top-[57px] z-20 border-b border-border bg-background/95 px-3 py-2 backdrop-blur-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the menu"
            aria-label="Search the menu"
            className="h-12 pl-9 pr-10 text-[15px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear the search"
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {!query && sections.length > 1 && (
          <div className="scrollbar-none -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#section-${section.id}`}
                className="h-9 shrink-0 whitespace-nowrap rounded-full border border-border-strong px-3 text-[13px] font-medium leading-9 text-muted-foreground"
              >
                {section.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <main className="flex-1 px-3 pb-44 pt-3">
        {found === 0 && <p className="py-16 text-center text-sm text-muted-foreground">Nothing on the menu matches “{query}”.</p>}

        {sections.map((section) => (
          <section key={section.id} id={`section-${section.id}`} className="scroll-mt-[150px] pb-5">
            <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.name}</h2>
            <ul className="flex flex-col gap-2">
              {section.dishes.map((dish) => {
                const quantity = quantityOf(dish.id)
                return (
                  <li
                    key={dish.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border bg-card p-2.5',
                      quantity > 0 ? 'border-brand' : 'border-border',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium leading-snug">{name(dish)}</span>
                      <span className="tnum block text-[13px] text-muted-foreground">{formatPrice(dish.price, money)}</span>
                    </span>
                    {/* A waiter is told the same thing the guest's menu says, rather than finding
                        out when the order is refused at the table. */}
                    {dish.soldOut ? (
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[13px] font-semibold">{MENU_TEXT[locale].soldOut}</span>
                    ) : (
                      <>
                        {quantity > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-12 w-12"
                              onClick={() => onQuantity(dish.id, quantity - 1)}
                              aria-label={`One less ${name(dish)}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <output className="tnum w-6 text-center text-lg font-semibold">{quantity}</output>
                          </>
                        )}
                        <Button size="icon" className="h-12 w-12" onClick={() => onAdd(dish.id)} aria-label={`Add ${name(dish)}`}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </main>
    </>
  )
}
