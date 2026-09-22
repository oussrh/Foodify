// components/menu/dish-tags.tsx
// The small pills under a dish's name on a menu row: sold out first, because it changes what the
// guest can do with the line; then popular; then the dietary tags the restaurant offers.
import { dietaryLabel, type Locale, type MenuDish } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'

/** Nothing at all when a dish has none of them, so the row keeps its two lines. */
export function DishTags({ dish, tags, locale }: { dish: MenuDish; tags: string[]; locale: Locale }) {
  const t = MENU_TEXT[locale]
  if (tags.length === 0 && !dish.isMostPurchased && !dish.soldOut) return null

  return (
    <span className="mt-0.5 flex flex-wrap gap-1.5">
      {/* The band over the photo is decorative; this is the same fact as text, which is what a
          screen reader and a guest who cannot make out the band both read. */}
      {dish.soldOut && <span className="rounded-full bg-muted px-1.5 py-px text-[11px] font-semibold text-foreground">{t.soldOut}</span>}
      {dish.isMostPurchased && <span className="rounded-full bg-brand-tint px-1.5 py-px text-[11px] font-medium text-brand">{t.popular}</span>}
      {tags.map((key) => (
        <span key={key} className="rounded-full border border-border-strong px-1.5 py-px text-[11px] text-muted-foreground">
          {dietaryLabel(key, locale)}
        </span>
      ))}
    </span>
  )
}
