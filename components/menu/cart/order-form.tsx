// components/menu/cart/order-form.tsx
// The foot of the cart sheet: the subtotal, where the order goes (the table, shown rather than
// asked for when the QR code carried it), the phone the confirmation is texted to, a note for
// the kitchen, and the button that sends it.
'use client'

import { formatPrice, type Locale, type Money } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { OrderField } from './order-check'
import TableField from './table-field'

interface OrderFormProps {
  subtotal: string
  table: string
  onTable: (table: string) => void
  /** The table came from the QR code: it is shown, not asked for. */
  tableLocked: boolean
  phone: string
  onPhone: (phone: string) => void
  note: string
  onNote: (note: string) => void
  /** Sends the order; the check against the route's schema is `usePlaceOrder`'s, which names the failing `field`. */
  onSubmit: () => void
  sending: boolean
  /** What went wrong with the last attempt, in the guest's language; '' when nothing did. */
  error: string
  /** The field the last attempt was refused over, marked invalid; null when none was. */
  field: OrderField | null
  locale: Locale
  money: Money
}

/**
 * The foot of the cart: the subtotal, the table (shown, not asked for, when the QR code carried
 * it), the phone, the note and the send button.
 */
export default function OrderForm({ subtotal, table, onTable, tableLocked, phone, onPhone, note, onNote, onSubmit, sending, error, field, locale, money }: OrderFormProps) {
  const t = MENU_TEXT[locale]

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      noValidate
      className="flex flex-col gap-4 border-t border-border pt-4"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold">{t.subtotal}</span>
        <span className="tnum text-lg font-semibold">{formatPrice(subtotal, money)}</span>
      </div>

      <TableField table={table} onTable={onTable} locked={tableLocked} invalid={field === 'table'} locale={locale} />

      <div className="space-y-1.5">
        <Label htmlFor="cart-phone">{t.phoneNumber}</Label>
        <Input
          id="cart-phone"
          type="tel"
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          inputMode="tel"
          autoComplete="tel"
          maxLength={20}
          required
          aria-invalid={field === 'phone' ? true : undefined}
          aria-describedby="cart-phone-hint"
          className="h-12 text-base"
        />
        <p id="cart-phone-hint" className="text-xs text-muted-foreground">
          {t.phoneHint}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cart-note">{t.orderNote}</Label>
        <Textarea id="cart-note" value={note} onChange={(e) => onNote(e.target.value)} maxLength={300} rows={2} aria-invalid={field === 'note' ? true : undefined} className="text-base" />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-brand px-4 text-[15px] font-semibold text-brand-on transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {sending ? t.sendingOrder : t.placeOrder}
      </button>
    </form>
  )
}
