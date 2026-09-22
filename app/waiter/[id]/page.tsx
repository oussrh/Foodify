import { redirect } from 'next/navigation'
import { serializeCategories, serializeDish } from '@/lib/menu-data'
import type { Locale, Money } from '@/lib/menu'
import { loadWaiterMenu } from '@/lib/restaurant-loader'
import WaiterApp from '@/components/waiter/waiter-app'

/**
 * The waiter app for one restaurant: its tables and its live menu. A reader who may not order for
 * this restaurant (a guest, a kitchen tablet, another restaurant's staff) is sent to the sign-in.
 */
export default async function WaiterRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await loadWaiterMenu((await params).id)
  if (!data) redirect('/waiter/login')

  const { restaurant } = data
  const money: Money = {
    locale: restaurant.defaultLocale === 'fr' ? 'fr' : 'en',
    symbol: restaurant.currencySymbol || '$',
    code: restaurant.currency,
  }

  return (
    <WaiterApp
      restaurant={{ id: restaurant.id, name: restaurant.name, tableCount: restaurant.tableCount }}
      categories={serializeCategories(restaurant.categories, restaurant.dietaryOptions)}
      loose={data.uncategorizedDishes.map((dish) => serializeDish(dish, restaurant.dietaryOptions))}
      money={money}
      locale={money.locale as Locale}
    />
  )
}
