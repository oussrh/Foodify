// components/orders/history-screen.tsx
// The Orders tab as both portals show it: the way onto the kitchen tablet, then what the
// restaurant has taken — in what state, and how long each stage took. The pages stay composition
// roots — guard, read, redirect — and this holds what they both render.
import { EmptyState, PageHeader } from '@/components/shell/page-header'
import type { Money } from '@/lib/menu'
import type { BoardOrder } from '@/lib/orders'
import { HISTORY_LIMIT } from '@/lib/restaurant-loader'
import BoardLinkCard from './board-link-card'
import HistoryTable from './history-table'

interface HistoryScreenProps {
  restaurant: { id: string; name: string; currency: string | null; currencySymbol: string | null; defaultLocale: string }
  orders: BoardOrder[]
  /** The absolute address of the tablet board, for the link staff send to the kitchen. */
  boardUrl: string
}

/**
 * The Orders tab both portals render: the link onto the kitchen tablet, then the restaurant's
 * recent orders and how long each stage took.
 */
export default function HistoryScreen({ restaurant, orders, boardUrl }: HistoryScreenProps) {
  const money: Money = {
    locale: restaurant.defaultLocale === 'fr' ? 'fr' : 'en',
    symbol: restaurant.currencySymbol || '$',
    code: restaurant.currency,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description={`The kitchen board, and the last ${HISTORY_LIMIT} orders: where each one got to, and how long it took.`}
      />

      <BoardLinkCard url={boardUrl} restaurantName={restaurant.name} />

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Orders placed from the public menu are listed here, with their timings." />
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">History</h2>
          <HistoryTable orders={orders} money={money} />
        </div>
      )}
    </div>
  )
}
