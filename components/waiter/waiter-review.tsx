// components/waiter/waiter-review.tsx
// The last look before it goes to the kitchen. A waiter takes an order at the table by listening,
// so the order they built and the order the guest said are not always the same thing — this is
// where that is caught, with the table read back at the top and every line editable.
//
// Both notes live here: one per dish ("no coriander") because that is what the guest says while
// pointing at a dish, and one for the whole order ("two starters first") because that is what
// they say at the end. They are separate fields because they reach the kitchen as separate
// things: a line note is printed against its dish, the order note against the ticket.
'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CartLineView } from '@/components/menu/cart/cart-lines'
import { formatPrice, type Locale, type Money } from '@/lib/menu'

interface WaiterReviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: string
  lines: CartLineView[]
  subtotal: string
  money: Money
  locale: Locale
  note: string
  onNote: (note: string) => void
  onQuantity: (dishId: string, quantity: number) => void
  onLineNote: (dishId: string, note: string) => void
  onSend: () => void
  sending: boolean
  error: string | null
}

export function WaiterReview(props: WaiterReviewProps) {
  const { open, onOpenChange, table, lines, subtotal, money, locale, note, onNote, onQuantity, onLineNote, onSend, sending, error } = props
  const name = (line: CartLineView) => (locale === 'fr' ? line.dish.nameFr : line.dish.nameEn)
  const items = lines.reduce((n, line) => n + line.quantity, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto p-0 sm:rounded-t-sheet">
        <div className="px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <SheetTitle className="text-lg font-semibold">Table {table}</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Read it back before it goes to the kitchen.
          </SheetDescription>

          <ul className="mt-3 flex flex-col gap-3">
            {lines.map((line) => (
              <li key={line.dish.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{name(line)}</span>
                    <span className="tnum block text-[13px] text-muted-foreground">{formatPrice(line.dish.price, money)}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => onQuantity(line.dish.id, line.quantity - 1)}
                    aria-label={line.quantity === 1 ? `Remove ${name(line)}` : `One less ${name(line)}`}
                  >
                    {line.quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                  </Button>
                  <output className="tnum w-6 text-center text-lg font-semibold">{line.quantity}</output>
                  <Button
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => onQuantity(line.dish.id, line.quantity + 1)}
                    aria-label={`One more ${name(line)}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Label htmlFor={`note-${line.dish.id}`} className="mt-2.5 block text-xs text-muted-foreground">
                  Note for the kitchen on this dish
                </Label>
                <Input
                  id={`note-${line.dish.id}`}
                  value={line.note}
                  onChange={(event) => onLineNote(line.dish.id, event.target.value)}
                  placeholder="No coriander, well done…"
                  className="mt-1 h-11"
                />
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Label htmlFor="order-note" className="block text-sm font-medium">
              Note for the whole order
            </Label>
            <Input
              id="order-note"
              value={note}
              onChange={(event) => onNote(event.target.value)}
              placeholder="Starters first, one birthday…"
              className="mt-1 h-12"
            />
          </div>

          <div className="tnum mt-4 flex items-center justify-between text-[15px] font-semibold">
            <span>
              {items} item{items === 1 ? '' : 's'}
            </span>
            <span>{formatPrice(subtotal, money)}</span>
          </div>

          {error && (
            <p role="alert" className="mt-2 text-center text-sm text-destructive">
              {error}
            </p>
          )}

          <Button className="mt-3 h-16 w-full text-lg" disabled={sending || items === 0} onClick={onSend}>
            {sending ? 'Sending…' : 'Send to the kitchen'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
