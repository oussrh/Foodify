// components/staff/restaurant-picker.tsx
// Which restaurant a member of staff is working in. Most accounts belong to one and never see
// this — their page sends them straight on — so this is for the few who cover several, and for
// the one that has not been assigned yet.
import Link from 'next/link'
import type { Route } from 'next'

interface RestaurantPickerProps {
  title: string
  restaurants: { id: string; name: string }[]
  /** The app this choice leads into, e.g. `/waiter` or `/kitchen/orders`. */
  basePath: string
}

export default function RestaurantPicker({ title, restaurants, basePath }: RestaurantPickerProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-display">{title}</h1>
      {restaurants.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This account is not assigned to a restaurant yet. Ask your Foodify administrator to add it on the restaurant&rsquo;s People tab.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <Link
                href={`${basePath}/${restaurant.id}` as Route}
                className="flex h-16 items-center rounded-lg border border-border bg-card px-4 text-lg font-semibold hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                {restaurant.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
