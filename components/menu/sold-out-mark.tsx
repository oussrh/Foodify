// components/menu/sold-out-mark.tsx
// The band across a dish the kitchen has run out of. It sits over the photo rather than replacing
// the dish, because a guest reading a menu wants to know what the restaurant cooks as well as
// what is left tonight — and because a dish that vanishes reads as a menu that changed, which
// sends the waiter a question. It says "today", so nobody asks whether it is gone for good.
import type { Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import { cn } from '@/lib/utils'

/**
 * Covers its positioned parent. `aria-hidden`: the same words are already on the row as text for
 * a screen reader, and a band read twice is a band read twice.
 */
export function SoldOutMark({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 flex items-center justify-center bg-background/55', className)}
    >
      <span className="rotate-[-8deg] rounded-sm bg-foreground/85 px-2 py-0.5 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-background">
        {MENU_TEXT[locale].soldOut}
      </span>
    </span>
  )
}
