// components/menu/cart/cart-line-row.tsx
// One line of the order in the cart sheet: the dish's thumbnail and name, its stepper, what
// that line comes to, and under it what the guest asked for on this dish.
'use client'

import DishPhoto from '@/components/menu/dish-photo'
import { formatPrice, type Locale, type MenuDish, type Money } from '@/lib/menu'
import { multiplyPrice } from '@/lib/money'
import LineNote from './line-note'
import QuantityStepper from './quantity-stepper'

interface CartLineRowProps {
  dish: MenuDish
  quantity: number
  onQuantity: (quantity: number) => void
  note: string
  onNote: (note: string) => void
  locale: Locale
  money: Money
}

export default function CartLineRow({ dish, quantity, onQuantity, note, onNote, locale, money }: CartLineRowProps) {
  const name = locale === 'fr' ? dish.nameFr : dish.nameEn
  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-3">
        <span className="block h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          <DishPhoto src={dish.imageUrl} alt="" sizes="48px" iconClassName="h-4 w-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[15px] font-semibold leading-snug">{name}</span>
          <span className="tnum text-[13px] text-muted-foreground">{formatPrice(dish.price, money)}</span>
        </span>
        <QuantityStepper name={name} quantity={quantity} onChange={onQuantity} locale={locale} />
        <span className="tnum w-[72px] shrink-0 text-right text-[15px] font-semibold">{formatPrice(multiplyPrice(dish.price, quantity), money)}</span>
      </div>
      <div className="pl-[60px]">
        <LineNote name={name} note={note} onNote={onNote} locale={locale} fieldId={`cart-note-${dish.id}`} />
      </div>
    </li>
  )
}
