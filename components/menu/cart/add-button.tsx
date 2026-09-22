// components/menu/cart/add-button.tsx
// The round + at the end of a menu row: one tap adds the dish. Once it is in the order the
// button shows the count and keeps adding; the stepper on the dish sheet takes it away again.
'use client'

import { Plus } from 'lucide-react'
import { type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import { cn } from '@/lib/utils'

interface AddButtonProps {
  name: string
  quantity: number
  onAdd: () => void
  locale: Locale
}

export default function AddButton({ name, quantity, onAdd, locale }: AddButtonProps) {
  const t = MENU_TEXT[locale]
  const inOrder = quantity > 0
  return (
    <button
      type="button"
      onClick={onAdd}
      aria-label={inOrder ? `${t.add(name)} — ${t.inOrder(quantity)}` : t.add(name)}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
        inOrder ? 'border-transparent bg-brand text-brand-on' : 'border-border-strong bg-card text-foreground hover:bg-accent',
      )}
    >
      {inOrder ? <span className="tnum">{quantity}</span> : <Plus className="h-5 w-5" aria-hidden="true" />}
    </button>
  )
}
