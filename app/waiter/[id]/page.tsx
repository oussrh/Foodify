import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { staffAppMetadata } from '@/lib/order-board-page'
import { serializeCategories, serializeDish } from '@/lib/menu-data'
import type { Locale, Money } from '@/lib/menu'
import { loadWaiterMenu } from '@/lib/restaurant-loader'
import { restaurantIdFromParam } from '@/lib/restaurant-loader'
import WaiterApp from '@/components/waiter/waiter-app'

/** A waiter installs this one: the manifest names the restaurant and opens straight onto its tables. */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return staffAppMetadata((await params).id, 'waiter', 'Service')
}

/**
 * The waiter app for one restaurant: its tables and its live menu. A reader who may not order for
 * this restaurant (a guest, a kitchen tablet, another restaurant's staff) is sent to the sign-in.
 */
export default async function WaiterRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const id = await restaurantIdFromParam((await params).id)
  const data = id ? await loadWaiterMenu(id) : null
  if (!data) redirect('/waiter/login')

  const { restaurant } = data
  const money: Money = {
    locale: restaurant.defaultLocale === 'fr' ? 'fr' : 'en',
    symbol: restaurant.currencySymbol || '$',
    code: restaurant.currency,
  }

  return (
    <WaiterApp
      restaurant={{ id: restaurant.id, code: restaurant.code, name: restaurant.name, tableCount: restaurant.tableCount }}
      categories={serializeCategories(restaurant.categories, restaurant.dietaryOptions)}
      loose={data.uncategorizedDishes.map((dish) => serializeDish(dish, restaurant.dietaryOptions))}
      money={money}
      locale={money.locale as Locale}
    />
  )
}
