// components/waiter/waiter-app.tsx
// The waiter's phone: the room's tables, and the order screen for whichever one is tapped. It is
// one screen with two states rather than two routes, so a waiter who walks away and comes back is
// where they were — and so the poll behind the tables is not torn down and restarted every time
// somebody opens a table.
'use client'

import { useState } from 'react'
import type { Locale, MenuCategory, MenuDish, Money } from '@/lib/menu'
import WaiterOrder from './waiter-order'
import { WaiterTables } from './waiter-tables'

interface WaiterAppProps {
  restaurant: { id: string; code: string; name: string; tableCount: number }
  categories: MenuCategory[]
  loose: MenuDish[]
  money: Money
  locale: Locale
}

export default function WaiterApp({ restaurant, categories, loose, money, locale }: WaiterAppProps) {
  const [table, setTable] = useState<string | null>(null)

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

  return <WaiterTables restaurant={restaurant} onOpenTable={setTable} />
}
