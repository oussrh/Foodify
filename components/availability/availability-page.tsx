// components/availability/availability-page.tsx
// The sold-out screen with the restaurant's menu already read and serialized. The two routes that
// mount it (the tablet, the waiter's phone) differ only in where they send a reader who may not be
// there, so everything else lives here rather than twice over. A manager uses the Dishes tab.
import { serializeCategories, serializeDish } from '@/lib/menu-data'
import type { Locale } from '@/lib/menu'
import { AvailabilityScreen } from './availability-screen'

/** The shape `loadServiceMenu` answers with. */
type ServiceMenu = NonNullable<Awaited<ReturnType<typeof import('@/lib/restaurant-loader').loadServiceMenu>>>

/**
 * Serializes a loaded service menu into the sold-out screen, so the tablet and the waiter routes
 * only decide where Back goes and whether a tab bar needs room.
 */
export function AvailabilityPage({ data, backHref, padded }: { data: ServiceMenu; backHref?: string | undefined; padded?: boolean | undefined }) {
  const { restaurant } = data
  return (
    <AvailabilityScreen
      backHref={backHref}
      padded={padded}
      restaurantName={restaurant.name}
      categories={serializeCategories(restaurant.categories, restaurant.dietaryOptions)}
      loose={data.uncategorizedDishes.map((dish) => serializeDish(dish, restaurant.dietaryOptions))}
      locale={(restaurant.defaultLocale === 'fr' ? 'fr' : 'en') as Locale}
    />
  )
}
