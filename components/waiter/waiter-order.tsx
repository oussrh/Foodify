// components/waiter/waiter-order.tsx
// Taking an order at the table: the menu on the left of a thumb, the order building at the foot
// of the screen, and one button to send it. It is the guest's cart underneath (`lib/cart.ts`),
// kept per table so a waiter can start one table, walk away, and come back to it — and the same
// `POST /api/orders`, which stamps who took it and asks for no phone from staff.
'use client'

import { Check, ChevronLeft, Minus, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cartLinesToSend, cartLineViews, cartSubtotal, dishesById } from '@/components/menu/cart/cart-lines'
import { useCart } from '@/components/menu/cart/use-cart'
import { usePlaceOrder } from '@/components/menu/cart/use-place-order'
import { Button } from '@/components/ui/button'
import { formatPrice, type Locale, type MenuCategory, type MenuDish, type Money } from '@/lib/menu'
import { cn } from '@/lib/utils'

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
  const placing = usePlaceOrder(locale, () => cart.clear())

  const dishes = dishesById(categories, loose)
  const lines = cartLineViews(cart.cart, dishes)
  const subtotal = cartSubtotal(lines)
  const items = lines.reduce((n, line) => n + line.quantity, 0)
  const name = (dish: MenuDish) => (locale === 'fr' ? dish.nameFr : dish.nameEn)

  const send = async () => {
    await placing.send({ restaurantId, table, phone: '', lines: cartLinesToSend(lines), note: '' })
  }
  // `usePlaceOrder` holds the order once the server answers; that is the confirmation screen.
  if (placing.order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Check className="h-14 w-14 text-success" aria-hidden="true" />
        <p className="text-2xl font-semibold tracking-display">Order #{placing.order.number} sent</p>
        <p className="text-muted-foreground">Table {table} · {restaurantName}</p>
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
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="h-12 w-12 shrink-0" onClick={onBack} aria-label="Back to the tables">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold leading-tight tracking-display">Table {table}</h1>
          <p className="truncate text-xs text-muted-foreground">{restaurantName}</p>
        </div>
      </header>

      <main className="flex-1 px-3 pb-40 pt-3">
        {categories.map((category) => (
          <section key={category.id} className="pb-5">
            <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {locale === 'fr' ? category.nameFr : category.nameEn}
            </h2>
            <ul className="flex flex-col gap-2">
              {category.subcategories.flatMap((sub) => sub.dishes).map((dish) => {
                const quantity = cart.quantityOf(dish.id)
                return (
                  <li key={dish.id} className={cn('flex items-center gap-2 rounded-lg border bg-card p-2.5', quantity > 0 ? 'border-brand' : 'border-border')}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium leading-snug">{name(dish)}</span>
                      <span className="tnum block text-[13px] text-muted-foreground">{formatPrice(dish.price, money)}</span>
                    </span>
                    {quantity > 0 && (
                      <>
                        <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => cart.setQuantity(dish.id, quantity - 1)} aria-label={`One less ${name(dish)}`}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <output className="tnum w-6 text-center text-lg font-semibold">{quantity}</output>
                      </>
                    )}
                    <Button size="icon" className="h-12 w-12" onClick={() => cart.addOne(dish.id)} aria-label={`Add ${name(dish)}`}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </main>

      {items > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          {placing.error && (
            <p role="alert" className="pb-2 text-center text-sm text-destructive">
              {placing.error}
            </p>
          )}
          <Button className="h-16 w-full text-lg" disabled={placing.status === 'sending'} onClick={send}>
            {placing.status === 'sending' ? 'Sending…' : `Send ${items} item${items === 1 ? '' : 's'} · ${formatPrice(subtotal, money)}`}
          </Button>
        </div>
      )}
    </div>
  )
}
