// components/menu/cart/quantity-stepper.tsx
// − n +: the quantity of one dish in the order, on the dish sheet and in the cart's lines.
// At 1 the minus removes the dish (the sheet then shows "Add to order" again); at the cart's
// ceiling the plus is disabled.
'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { MAX_QUANTITY } from '@/lib/cart'
import { MENU_TEXT, type Locale } from '@/lib/menu'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  name: string
  quantity: number
  onChange: (quantity: number) => void
  locale: Locale
  className?: string
}

const CONTROL = 'inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:hover:bg-transparent'

export default function QuantityStepper({ name, quantity, onChange, locale, className }: QuantityStepperProps) {
  const t = MENU_TEXT[locale]
  const removing = quantity <= 1
  return (
    <div role="group" aria-label={t.quantityOf(name)} className={cn('inline-flex items-center rounded-full border border-border-strong bg-card', className)}>
      <button type="button" onClick={() => onChange(quantity - 1)} aria-label={removing ? t.remove(name) : t.oneLess(name)} className={CONTROL}>
        {removing ? <Trash2 className="h-4 w-4" aria-hidden="true" /> : <Minus className="h-4 w-4" aria-hidden="true" />}
      </button>
      <output aria-live="polite" className="tnum min-w-[2ch] text-center text-[15px] font-semibold">
        {quantity}
      </output>
      <button type="button" onClick={() => onChange(quantity + 1)} disabled={quantity >= MAX_QUANTITY} aria-label={t.oneMore(name)} className={CONTROL}>
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
