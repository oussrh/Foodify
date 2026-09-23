// components/qr/tables-panel.tsx
// The Tables tab as both portals show it: the heading, then the printable sheet of per-table QR
// codes. The pages differ only in how they reach the restaurant (a manager's own, or any), so
// what they render lives here.
import { PageHeader } from '@/components/shell/page-header'
import TableQrSheet from './table-qr-sheet'

interface TablesPanelProps {
  restaurant: { id: string; name: string; slug: string; tableCount: number }
  /** Absolute origin of the public menu, e.g. https://foodify.app */
  origin: string
}

/**
 * The Tables tab both portals render: the page header, then the per-table QR sheet; the pages only
 * differ in how they load the restaurant.
 */
export function TablesPanel({ restaurant, origin }: TablesPanelProps) {
  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        title="Tables"
        description="A QR code per table: the guest scans it and orders without typing their table number."
        className="print:hidden"
      />
      <TableQrSheet
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        slug={restaurant.slug}
        origin={origin}
        tableCount={restaurant.tableCount}
      />
    </div>
  )
}
