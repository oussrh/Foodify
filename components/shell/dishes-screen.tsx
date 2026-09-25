// components/shell/dishes-screen.tsx
// The Dishes tab as both portals render it: the header with Add dish, the stat strip (not while
// searching) and the searchable table. The pages keep their guard and their reads and hand the
// restaurant and its rows here, so the two portals cannot drift apart.
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shell/page-header'
import DishesList, { type DishListRow } from '@/components/shell/dishes-list'
import { DishStatStrip } from '@/components/shell/dish-stat-strip'
import { restaurantPath, type RestaurantPortal } from '@/lib/restaurant-paths'

interface DishesScreenProps {
  portal: RestaurantPortal
  restaurant: { code: string; name: string; currencySymbol: string | null }
  rows: DishListRow[]
  search: string
}

/** The Dishes tab: header and Add dish, the stat strip, and the table of `rows`. */
export function DishesScreen({ portal, restaurant, rows, search }: DishesScreenProps) {
  const create = restaurantPath(portal, restaurant.code, 'dishes/create')
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dishes"
        description={restaurant.name}
        actions={
          <Button asChild>
            <Link href={create}>
              <Plus className="h-4 w-4" />
              Add dish
            </Link>
          </Button>
        }
      />
      {!search && rows.length > 0 && <DishStatStrip rows={rows} />}
      <DishesList
        portal={portal}
        restaurantCode={restaurant.code}
        currency={restaurant.currencySymbol || '$'}
        rows={rows}
        search={search}
        emptyAction={
          <Button asChild>
            <Link href={create}>Add dish</Link>
          </Button>
        }
      />
    </div>
  )
}
