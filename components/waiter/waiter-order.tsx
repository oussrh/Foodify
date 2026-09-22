// components/waiter/waiter-order.tsx
// Taking an order at the table: the menu to build it, a review sheet to read it back, and one
// button to send. It is the guest's cart underneath (`lib/cart.ts`), kept per table so a waiter
// can start one table, walk away, and come back to it — and the same `POST /api/orders`, which
// stamps who took it and asks for no phone from staff.
'use client'

import { useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cartLinesToSend, cartLineViews, cartSubtotal, dishesById } from '@/components/menu/cart/cart-lines'
import { useCart } from '@/components/menu/cart/use-cart'
import { usePlaceOrder } from '@/components/menu/cart/use-place-order'
import { Button } from '@/components/ui/button'
import { formatPrice, type Locale, type MenuCategory, type MenuDish, type Money } from '@/lib/menu'
import { WaiterMenu } from './waiter-menu'
import { WaiterReview } from './waiter-review'

interface WaiterOrderProps {
  restaurantId: string
  restaurantName: string
  table: string
  categories: MenuCategory[]
  loose: MenuDish[]
  money: Money
  locale: Locale
  /** Back to this restaurant's tables. */
  onBack: () => void
}

export default function WaiterOrder({ restaurantId, restaurantName, table, categories, loose, money, locale, onBack }: WaiterOrderProps) {
  const router = useRouter()
  // One cart per table: the key carries the table, so two tables never share an order.
  const cart = useCart(`${restaurantId}:t${table}`, table)
  const [note, setNote] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const placing = usePlaceOrder(locale, () => {
    cart.clear()
    setNote('')
  })

  const lines = cartLineViews(cart.cart, dishesById(categories, loose))
  const subtotal = cartSubtotal(lines)
  const items = lines.reduce((n, line) => n + line.quantity, 0)

  const send = async () => {
    await placing.send({ restaurantId, table, phone: '', lines: cartLinesToSend(lines), note })
    setReviewing(false)
  }

  // `usePlaceOrder` holds the order once the server answers; that is the confirmation screen.
  if (placing.order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Check className="h-14 w-14 text-success" aria-hidden="true" />
        <p className="text-2xl font-semibold tracking-display">Order #{placing.order.number} sent</p>
        <p className="text-muted-foreground">
          Table {table} · {restaurantName}
        </p>
        <Button
          className="mt-4 h-14 w-full max-w-xs text-[15px]"
          onClick={() => {
            placing.reset()
            router.refresh()
            onBack()
          }}
        >
          Back to the tables
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-[57px] items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" onClick={onBack} aria-label="Back to the tables">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold leading-tight tracking-display">Table {table}</h1>
          <p className="truncate text-xs text-muted-foreground">{restaurantName}</p>
        </div>
      </header>

      <WaiterMenu
        categories={categories}
        loose={loose}
        money={money}
        locale={locale}
        quantityOf={cart.quantityOf}
        onAdd={cart.addOne}
        onQuantity={cart.setQuantity}
      />

      {items > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          {placing.error && !reviewing && (
            <p role="alert" className="pb-2 text-center text-sm text-destructive">
              {placing.error}
            </p>
          )}
          {/* Review rather than send: a waiter builds this from what someone said across a table,
              and the notes belong to the reading-back, not to the tapping. */}
          <Button className="h-16 w-full text-lg" onClick={() => setReviewing(true)}>
            Review {items} item{items === 1 ? '' : 's'} · {formatPrice(subtotal, money)}
          </Button>
        </div>
      )}

      <WaiterReview
        open={reviewing}
        onOpenChange={setReviewing}
        table={table}
        lines={lines}
        subtotal={subtotal}
        money={money}
        locale={locale}
        note={note}
        onNote={setNote}
        onQuantity={cart.setQuantity}
        onLineNote={cart.setNote}
        onSend={send}
        sending={placing.status === 'sending'}
        error={placing.error}
      />
    </div>
  )
}
