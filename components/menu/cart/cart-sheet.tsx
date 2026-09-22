// components/menu/cart/cart-sheet.tsx
// The order the guest has built: its lines with their steppers, then the table number, the
// note and the button that sends it — or, once it is sent, the order number. In the
// restaurant's brand and theme, like the dish sheet.
'use client'

import { useState, type CSSProperties } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { MENU_TEXT, type Locale, type Money } from '@/lib/menu'
import { cn } from '@/lib/utils'
import type { CartApi } from './use-cart'
import type { CartLineView } from './cart-lines'
import { cartLinesToSend, cartSubtotal } from './cart-lines'
import CartLineRow from './cart-line-row'
import OrderForm from './order-form'
import OrderSent from './order-sent'
import { usePlaceOrder } from './use-place-order'

interface CartSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurantId: string
  restaurantName: string
  lines: CartLineView[]
  cart: CartApi
  /** The table came from the QR code, so it is shown rather than asked for. */
  tableLocked: boolean
  locale: Locale
  money: Money
  /** '' when the menu follows the device; the forced theme's class otherwise */
  themeClass: string
  brandStyle: Record<string, string>
}

export default function CartSheet({ open, onOpenChange, restaurantId, restaurantName, lines, cart, tableLocked, locale, money, themeClass, brandStyle }: CartSheetProps) {
  const t = MENU_TEXT[locale]
  const [note, setNote] = useState('')
  const [phone, setPhone] = useState('')
  const placing = usePlaceOrder(locale, () => {
    cart.clear()
    setNote('')
  })
  const subtotal = cartSubtotal(lines)

  const close = () => {
    onOpenChange(false)
    if (placing.status === 'sent') placing.reset()
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent side="bottom" className={cn('mx-auto w-full max-w-lg overflow-y-auto p-0 sm:rounded-t-sheet', themeClass)} style={brandStyle as CSSProperties}>
        <div lang={locale} className="brand-scope px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
          <SheetTitle className="text-lg font-semibold">{t.yourOrder}</SheetTitle>
          <SheetDescription className="sr-only">{restaurantName}</SheetDescription>

          {placing.order ? (
            <OrderSent order={placing.order} onDone={close} locale={locale} />
          ) : lines.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">{t.emptyOrder}</p>
          ) : (
            <>
              <ul className="divide-y divide-border pb-4 pt-2">
                {lines.map((line) => (
                  <CartLineRow
                    key={line.dish.id}
                    dish={line.dish}
                    quantity={line.quantity}
                    onQuantity={(quantity) => cart.setQuantity(line.dish.id, quantity)}
                    note={line.note}
                    onNote={(note) => cart.setNote(line.dish.id, note)}
                    locale={locale}
                    money={money}
                  />
                ))}
              </ul>
              <OrderForm
                subtotal={subtotal}
                table={cart.cart.table}
                onTable={cart.setTable}
                tableLocked={tableLocked}
                phone={phone}
                onPhone={setPhone}
                note={note}
                onNote={setNote}
                // The lines the sheet is showing, not every stored one: a dish taken off the menu is already gone from them.
                onSubmit={() => placing.send({ restaurantId, table: cart.cart.table, phone, lines: cartLinesToSend(lines), note })}
                sending={placing.status === 'sending'}
                error={placing.error}
                locale={locale}
                money={money}
              />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
