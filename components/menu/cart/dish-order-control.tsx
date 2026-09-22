// components/menu/cart/dish-order-control.tsx
// On the dish sheet and the dish page: "Add to order" while the dish is not in the order, and
// once it is, the stepper with the line's total and the note the guest can leave on it.
'use client'

import { formatPrice, MENU_TEXT, type Locale, type MenuDish, type Money } from '@/lib/menu'
import { multiplyPrice } from '@/lib/money'
import LineNote from './line-note'
import QuantityStepper from './quantity-stepper'

/** What a dish body needs to put the dish in the order: how many are in it, what was asked for on it, and the way to change either. */
export interface DishOrder {
  quantity: number
  onChange: (quantity: number) => void
  note: string
  onNote: (note: string) => void
}

interface DishOrderControlProps {
  dish: MenuDish
  order: DishOrder
  locale: Locale
  money: Money
}

export default function DishOrderControl({ dish, order, locale, money }: DishOrderControlProps) {
  const t = MENU_TEXT[locale]
  const name = locale === 'fr' ? dish.nameFr : dish.nameEn
  if (order.quantity === 0) {
    return (
      <button
        type="button"
        onClick={() => order.onChange(1)}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-brand px-4 text-[15px] font-semibold text-brand-on transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t.addToOrder}
      </button>
    )
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <QuantityStepper name={name} quantity={order.quantity} onChange={order.onChange} locale={locale} />
        <span className="tnum text-[15px] font-semibold">{formatPrice(multiplyPrice(dish.price, order.quantity), money)}</span>
      </div>
      <LineNote name={name} note={order.note} onNote={order.onNote} locale={locale} fieldId={`dish-note-${dish.id}`} />
    </div>
  )
}
