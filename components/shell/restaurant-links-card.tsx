// components/shell/restaurant-links-card.tsx
// The three addresses a restaurant runs on, in one place: the menu a diner scans, the board on
// the pass, the app on the floor. They are together because they are handed out together — a
// restaurant opening for service sets up all three, on three different devices, from here.
import { Globe, Smartphone, Tablet } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LinkRow } from '@/components/shell/link-row'
import type { RestaurantLinks } from '@/lib/restaurant-links'

interface RestaurantLinksCardProps {
  restaurantName: string
  links: RestaurantLinks
}

/** One card, one row per address; each row opens, copies or shares its own link. */
export function RestaurantLinksCard({ restaurantName, links }: RestaurantLinksCardProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Links</CardTitle>
        <CardDescription>
          One address for diners and one for each device that works the service. Staff sign in with the username and
          password set on the People tab, then stay signed in for a month.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y divide-border p-0">
        <LinkRow
          icon={<Globe className="h-4 w-4 text-muted-foreground" />}
          title="Public menu"
          description="Where diners land when they scan the QR code. It follows the name, colours and language set in Settings."
          url={links.menu}
          shareTitle={`${restaurantName} · menu`}
          shareText="Our menu"
        />
        <LinkRow
          icon={<Tablet className="h-4 w-4 text-muted-foreground" />}
          title="Order tablet"
          description="The kitchen board, for the tablet on the pass. Orders arrive on their own with a chime; staff move them along by hand. Open it once and leave it open."
          url={links.tablet}
          shareTitle={`${restaurantName} · order tablet`}
          shareText="Open this on the kitchen tablet"
        />
        <LinkRow
          icon={<Smartphone className="h-4 w-4 text-muted-foreground" />}
          title="Waiter app"
          description="For a phone on the floor: the room's tables and the live menu, to take an order for a guest who would rather not order themselves."
          url={links.waiter}
          shareTitle={`${restaurantName} · waiter app`}
          shareText="Open this on your phone to take orders"
        />
      </CardContent>
    </Card>
  )
}
