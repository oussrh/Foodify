// components/availability/availability-screen.tsx
// "We've run out." One screen, three places: the tablet on the pass, the waiter's phone and the
// manager's portal, because whoever notices the pan is empty is whoever should be able to say so
// — and on a Saturday that is rarely the person with the portal open.
//
// Built for a thumb in a hurry: one row per dish, one tap, no confirmation step and no save
// button. The tap is the save, and it is reversible with the same tap, which is what makes going
// without a confirmation safe. Rows stay where they are when toggled — a list that reorders under
// a moving thumb marks the wrong dish.
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setDishAvailability } from '@/app/actions/dish-availability-actions'
import { MENU_TEXT } from '@/lib/menu-text'
import { localName, type Locale, type MenuCategory, type MenuDish } from '@/lib/menu'
import { cn } from '@/lib/utils'

interface AvailabilityScreenProps {
  restaurantName: string
  categories: MenuCategory[]
  /** Dishes with no category; they still sell, so they still run out. */
  loose: MenuDish[]
  locale: Locale
}

export function AvailabilityScreen({ restaurantName, categories, loose, locale }: AvailabilityScreenProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  // What the screen shows for a dish while its write is in flight, so the row answers the tap at
  // once instead of after a round trip. The server's answer replaces it on refresh.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({})

  const soldOutOf = (dish: MenuDish) => optimistic[dish.id] ?? dish.soldOut

  const toggle = (dish: MenuDish) => {
    const next = !soldOutOf(dish)
    setOptimistic((current) => ({ ...current, [dish.id]: next }))
    startTransition(async () => {
      try {
        await setDishAvailability(dish.id, { soldOut: next })
        router.refresh()
      } catch {
        // Put the row back where it was: the menu did not change, so the screen must not claim it did.
        setOptimistic((current) => ({ ...current, [dish.id]: !next }))
        toast.error('Could not change that dish. Try again.')
      }
    })
  }

  const sections = [
    ...categories.map((category) => ({
      id: category.id,
      name: localName(locale, category.nameEn, category.nameFr),
      dishes: category.subcategories.flatMap((sub) => sub.dishes),
    })),
    ...(loose.length > 0 ? [{ id: 'loose', name: localName(locale, 'Other dishes', 'Autres plats'), dishes: loose }] : []),
  ].filter((section) => section.dishes.length > 0)

  const soldOutCount = sections.reduce((n, s) => n + s.dishes.filter(soldOutOf).length, 0)

  return (
    <div className="flex flex-col gap-5 pb-8">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold">{localName(locale, 'Sold out', 'Ruptures')}</h1>
        <p className="text-sm text-muted-foreground">
          {restaurantName} ·{' '}
          {soldOutCount === 0
            ? localName(locale, 'everything is available', 'tout est disponible')
            : `${soldOutCount} ${localName(locale, 'marked sold out', 'en rupture')}`}
        </p>
      </header>

      <p className="text-sm text-muted-foreground">
        {localName(
          locale,
          'Tap a dish to take it off tonight. It stays on the menu, marked sold out, and comes back by itself for the next service.',
          'Touchez un plat pour le retirer ce soir. Il reste au menu, signalé en rupture, et revient de lui-même au prochain service.',
        )}
      </p>

      {sections.map((section) => (
        <section key={section.id} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.name}</h2>
          <ul className="flex flex-col gap-2">
            {section.dishes.map((dish) => {
              const soldOut = soldOutOf(dish)
              return (
                <li key={dish.id}>
                  <button
                    type="button"
                    onClick={() => toggle(dish)}
                    aria-pressed={soldOut}
                    disabled={pending}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60',
                      soldOut ? 'border-border bg-muted text-muted-foreground' : 'border-border bg-card hover:bg-accent',
                    )}
                  >
                    <span className={cn('min-w-0 flex-1 truncate text-[15px] font-medium', soldOut && 'line-through')}>
                      {localName(locale, dish.nameEn, dish.nameFr)}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold',
                        soldOut ? 'bg-foreground text-background' : 'bg-muted text-foreground',
                      )}
                    >
                      {soldOut ? MENU_TEXT[locale].soldOut : localName(locale, 'Available', 'Disponible')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
