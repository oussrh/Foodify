// components/waiter/waiter-app.tsx
// The waiter's phone: the room's tables, each saying what is already open on it, and the order
// screen for whichever one is tapped. It is one screen with two states rather than two routes,
// so a waiter who walks away and comes back is where they were.
'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useMinuteClock } from '@/components/orders/use-minute-clock'
import { useOrderBoard } from '@/components/orders/use-order-board'
import { Button } from '@/components/ui/button'
import type { Locale, MenuCategory, MenuDish, Money } from '@/lib/menu'
import { itemCount, minutesWaiting, STATUS_LABEL } from '@/lib/orders'
import { tableNumbers } from '@/components/qr/table-qr'
import { cn } from '@/lib/utils'
import WaiterOrder from './waiter-order'

interface WaiterAppProps {
  restaurant: { id: string; name: string; tableCount: number }
  categories: MenuCategory[]
  loose: MenuDish[]
  money: Money
  locale: Locale
}

/** Nothing to announce: a waiter's phone must not chime in a dining room. */
const silent = () => undefined

export default function WaiterApp({ restaurant, categories, loose, money, locale }: WaiterAppProps) {
  const [table, setTable] = useState<string | null>(null)
  const { orders, loading, refresh } = useOrderBoard(restaurant.id, 'open', silent)
  // One clock for every tile, so the waits tick without each one reading it in render.
  const now = useMinuteClock()

  if (table !== null) {
    return (
      <WaiterOrder
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        table={table}
        categories={categories}
        loose={loose}
        money={money}
        locale={locale}
        onBack={() => setTable(null)}
      />
    )
  }

  const tables = tableNumbers(restaurant.tableCount)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/95 px-3 py-2.5 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold leading-tight tracking-display">Tables</h1>
          <p className="truncate text-xs text-muted-foreground">{restaurant.name}</p>
        </div>
        <Button variant="outline" onClick={refresh} aria-label="Check the open orders again" className="h-12 min-w-12 px-3">
          <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
        </Button>
      </header>

      <main className="flex-1 px-3 py-4">
        {tables.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No tables are set for this restaurant yet. An administrator sets how many in Settings.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {tables.map((number) => {
              const open = orders.filter((order) => order.table === String(number))
              const waiting = open.length > 0 ? Math.max(...open.map((order) => minutesWaiting(order.createdAt, now))) : 0
              return (
                <li key={number}>
                  <button
                    type="button"
                    onClick={() => setTable(String(number))}
                    className={cn(
                      'flex h-28 w-full flex-col items-start justify-between rounded-lg border-2 bg-card p-3 text-left focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
                      open.length > 0 ? 'border-brand' : 'border-border',
                    )}
                  >
                    <span className="text-2xl font-semibold leading-none tracking-display">{number}</span>
                    {open.length === 0 ? (
                      <span className="text-[13px] text-muted-foreground">Free</span>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">
                        <span className="block font-medium text-foreground">
                          {open.length} order{open.length === 1 ? '' : 's'} · {open.reduce((n, order) => n + itemCount(order), 0)} items
                        </span>
                        <span className="tnum block">
                          {STATUS_LABEL[open[0]!.status]} · {waiting} min
                        </span>
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {orders.length > 0 && (
          <p className="tnum pt-4 text-center text-xs text-muted-foreground">
            {orders.length} open order{orders.length === 1 ? '' : 's'} in the kitchen
          </p>
        )}
      </main>
    </div>
  )
}
