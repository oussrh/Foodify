// components/orders/board-screen.tsx
// The kitchen board as a portal page shows it: the restaurant's money and the way back into the
// portal, which are the only things the two portals' pages differ by. The pages stay composition
// roots — guard, read, redirect — and this holds what they both render.
import type { Route } from 'next'
import type { Money } from '@/lib/menu'
import OrderBoard from './order-board'

interface BoardScreenProps {
  restaurant: { id: string; name: string; currency: string | null; currencySymbol: string | null; defaultLocale: string }
  /** 'kitchen' is the tablet's own route: it has no portal to go back to, so it is offered none. */
  portal: 'admin' | 'manager' | 'kitchen'
}

export default function BoardScreen({ restaurant, portal }: BoardScreenProps) {
  const money: Money = {
    locale: restaurant.defaultLocale === 'fr' ? 'fr' : 'en',
    symbol: restaurant.currencySymbol || '$',
    code: restaurant.currency,
  }
  return (
    <OrderBoard
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      money={money}
      backHref={portal === 'kitchen' ? undefined : (`/${portal}/restaurants/${restaurant.id}/info` as Route)}
    />
  )
}
