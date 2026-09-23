// components/manager/profile/restaurants-card.tsx
// The restaurants this manager account is assigned to, one row each with the way to its menu;
// a line instead when there is none yet.
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ProfileRestaurant {
  id: string
  name: string
  slug: string
}

/**
 * The restaurants a manager account is assigned to, each linking to its info page and its menu; a
 * line in their place when there is none.
 */
export function RestaurantsCard({ restaurants }: { restaurants: ProfileRestaurant[] }) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Restaurants</CardTitle>
        <CardDescription>What this account manages.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {restaurants.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No restaurant assigned yet. Ask your Foodify administrator to add you to one.</p>
        ) : (
          <ul className="divide-y divide-border">
            {restaurants.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/manager/restaurants/${r.id}/info`} className="block truncate text-sm font-medium hover:underline">
                    {r.name}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">/{r.slug}</span>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/manager/restaurants/${r.id}/menu`}>Menu</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
