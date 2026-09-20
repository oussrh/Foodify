"use client"

import { MENU_TEXT, allergenLabel, dietaryLabel, type Locale, type MenuDish } from '@/lib/menu'

interface DishDetailsProps {
  dish: MenuDish
  locale: Locale
}

/** "Popular" and the dietary tags, or nothing when the dish has neither. */
export function DishTags({ dish, locale }: DishDetailsProps) {
  const t = MENU_TEXT[locale]
  if (dish.dietary.length === 0 && !dish.isMostPurchased) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {dish.isMostPurchased && (
        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-medium text-brand">{t.popular}</span>
      )}
      {dish.dietary.map((key) => (
        <span key={key} className="rounded-full border border-border-strong px-2.5 py-1 text-xs text-foreground">
          {dietaryLabel(key, locale)}
        </span>
      ))}
    </div>
  )
}

/** The ingredient list, or nothing when the dish has none. */
export function DishIngredients({ dish, locale }: DishDetailsProps) {
  const t = MENU_TEXT[locale]
  if (dish.ingredients.length === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{t.ingredients}</h3>
      <ul className="flex flex-wrap gap-1.5">
        {dish.ingredients.map((ing) => (
          <li key={ing.id} className="rounded-full border border-border-strong px-2.5 py-1 text-xs">
            {locale === 'fr' ? ing.nameFr : ing.nameEn}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Calories and allergens, or nothing when the dish declares neither. */
export function DishFacts({ dish, locale }: DishDetailsProps) {
  const t = MENU_TEXT[locale]
  if (dish.calories === null && dish.allergens.length === 0) return null
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground">
      {dish.calories !== null && (
        <div className="flex gap-1">
          <dd className="tnum font-medium text-foreground">{dish.calories}</dd>
          <dt>{t.kcal}</dt>
        </div>
      )}
      {dish.allergens.length > 0 && (
        <div className="flex gap-1">
          <dt>{t.contains}</dt>
          <dd className="font-medium text-foreground">
            {dish.allergens.map((a) => allergenLabel(a, locale)).join(', ')}
          </dd>
        </div>
      )}
    </dl>
  )
}
