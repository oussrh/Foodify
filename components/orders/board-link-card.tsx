// components/orders/board-link-card.tsx
// How the kitchen gets its board, said again where the orders are read. The Info tab lists every
// address a restaurant hands out; this is the one of them a person looking at the order history
// is most likely to want, so it is here too rather than a tab away.
import { Tablet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LinkRow } from '@/components/shell/link-row'

interface BoardLinkCardProps {
  /** The absolute address of the kitchen board, e.g. https://foodify.app/manager/orders/<id> */
  url: string
  restaurantName: string
}

export default function BoardLinkCard({ url, restaurantName }: BoardLinkCardProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <LinkRow
          icon={<Tablet className="h-4 w-4 text-muted-foreground" />}
          title="Kitchen board"
          description="Open this on the tablet in the kitchen: new orders arrive on their own, with a chime, and staff move them along by hand. Sign in once and leave it open."
          url={url}
          shareTitle={`Kitchen board · ${restaurantName}`}
          shareText="Open this on the kitchen tablet"
        />
      </CardContent>
    </Card>
  )
}
