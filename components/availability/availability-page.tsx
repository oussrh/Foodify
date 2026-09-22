// components/availability/availability-page.tsx
// The sold-out screen with the restaurant's menu already read and serialized. The three routes
// that mount it (the tablet, the waiter's phone, the portal) differ only in how they redirect a
// reader who may not be there, so everything else lives here rather than three times over.
import { serializeCategories, serializeDish } from '@/lib/menu-data'
import type { Locale } from '@/lib/menu'
import { AvailabilityScreen } from './availability-screen'

/** The shape `loadServiceMenu` answers with. */
type ServiceMenu = NonNullable<Awaited<ReturnType<typeof import('@/lib/restaurant-loader').loadServiceMenu>>>

export function AvailabilityPage({ data }: { data: ServiceMenu }) {
  const { restaurant } = data
  return (
    <AvailabilityScreen
      restaurantName={restaurant.name}
      categories={serializeCategories(restaurant.categories, restaurant.dietaryOptions)}
      loose={data.uncategorizedDishes.map((dish) => serializeDish(dish, restaurant.dietaryOptions))}
      locale={(restaurant.defaultLocale === 'fr' ? 'fr' : 'en') as Locale}
    />
  )
}
