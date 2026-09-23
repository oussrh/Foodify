// components/shell/restaurant-info-screen.tsx
// The Info tab, as both portals show it: how much the menu is being opened, the QR code to print,
// and every address this restaurant hands out. A super admin and a manager read the same page —
// only the query behind it differs, which is the page's business, not this file's.
import Link from 'next/link'
import type { Route } from 'next'
import { ExternalLink, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, StatStrip } from '@/components/shell/page-header'
import { RestaurantLinksCard } from '@/components/shell/restaurant-links-card'
import TableCountDialog from '@/components/qr/table-count-dialog'
import QRCodeDisplay from '@/components/qr-code-display'
import type { RestaurantLinks } from '@/lib/restaurant-links'

/** What the strip counts: the live menu, and how often it has been opened. */
export interface InfoStats {
  dishes: number
  views: number
  recent: number
  arViews: number
}

interface RestaurantInfoScreenProps {
  restaurantId: string
  restaurantName: string
  links: RestaurantLinks
  stats: InfoStats
  /** The Tables tab of this restaurant, in the portal the reader is in. */
  tablesHref: string
  /** How many tables the room has; none means the per-table sheet is still empty. */
  tableCount: number
}

/**
 * The Info tab for both portals: how much the menu is opened, the QR code to print, and every
 * address the restaurant hands out.
 */
export function RestaurantInfoScreen({ restaurantId, restaurantName, links, stats, tablesHref, tableCount }: RestaurantInfoScreenProps) {
  const { dishes, views, recent, arViews } = stats

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Public menu"
        description="The link and QR code diners use, how often they open it, and the addresses your staff's devices run on."
        actions={
          <Button asChild variant="outline">
            <a href={links.menu} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open menu
            </a>
          </Button>
        }
      />

      <StatStrip
        stats={[
          { label: 'Live dishes', value: dishes },
          { label: 'Dish views, all time', value: views.toLocaleString() },
          { label: 'Views, last 30 days', value: recent.toLocaleString() },
          {
            label: 'AR sessions',
            value: arViews.toLocaleString(),
            hint: views > 0 ? `${Math.round((arViews / views) * 100)}% of views` : undefined,
          },
        ]}
      />

      {/* Both full width: a link row needs room for its address and its three buttons, and the
          QR code squeezed into a narrow column beside three of them read as an afterthought. */}
      <section className="flex flex-col items-center gap-6 rounded-lg border border-border bg-card p-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
        <div className="flex shrink-0 flex-col items-center">
          <QRCodeDisplay url={links.menu} restaurantName={restaurantName} />
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Menu QR code</h2>
          <p className="text-sm text-muted-foreground">
            Print this on tables, menus or the door. It opens the public menu below, and keeps working through a change
            of name, colours or language — those are settings, not a new code.
          </p>
          {/* The one code above is the whole restaurant's; the table sheet is what makes an order
              arrive in the kitchen knowing where to take it. */}
          <p className="text-sm text-muted-foreground">
            {tableCount > 0
              ? `A code per table fills the table number in for the diner, so an order never reaches the wrong one. You have ${tableCount} table${tableCount === 1 ? '' : 's'} set.`
              : 'A code per table would fill the table number in for the diner, so an order never reaches the wrong one. Say how many tables the room has to print them.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {tableCount > 0 && (
              <Button asChild variant="outline">
                <Link href={tablesHref as Route}>
                  <Printer className="h-4 w-4" />
                  Print a code per table
                </Link>
              </Button>
            )}
            <TableCountDialog
              restaurantId={restaurantId}
              tableCount={tableCount}
              trigger={<Button variant={tableCount > 0 ? 'ghost' : 'outline'}>{tableCount > 0 ? 'Change tables' : 'Set the number of tables'}</Button>}
            />
          </div>
        </div>
      </section>

      <RestaurantLinksCard restaurantName={restaurantName} links={links} />
    </div>
  )
}
