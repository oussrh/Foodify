import Link from 'next/link'
import type { Route } from 'next'
import Image from 'next/image'
import { Utensils } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shell/page-header'
import { ListSearch } from '@/components/shell/list-search'
import { RestaurantRowMenu } from '@/components/shell/row-actions'

export interface RestaurantListRow {
  id: string
  name: string
  slug: string
  city: string | null
  logoUrl: string | null
  dishCount: number
  liveCount: number
  categoryCount: number
  managerCount: number
}

interface RestaurantsListProps {
  portal: 'admin' | 'manager'
  rows: RestaurantListRow[]
  search: string
  emptyAction?: React.ReactNode
}

/** Search box (GET) plus the table. Server-renderable. */
export default function RestaurantsList({ portal, rows, search, emptyAction }: RestaurantsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <ListSearch value={search} placeholder="Search restaurants" label="Search restaurants" />

      {rows.length === 0 ? (
        <EmptyState
          title={search ? `Nothing matches “${search}”` : 'No restaurants yet'}
          description={search ? 'Try a shorter word, or clear the search.' : undefined}
          action={search ? <Link href={`/${portal}/restaurants` as Route} className="text-sm font-medium text-primary hover:underline">Clear search</Link> : emptyAction}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead className="hidden sm:table-cell">City</TableHead>
              <TableHead>Dishes</TableHead>
              <TableHead className="hidden md:table-cell">Categories</TableHead>
              {portal === 'admin' && <TableHead className="hidden md:table-cell">Managers</TableHead>}
              <TableHead className="w-[1%]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                      {r.logoUrl ? (
                        <Image src={r.logoUrl} alt="" fill sizes="36px" className="object-cover" />
                      ) : (
                        <Utensils className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <Link href={`/${portal}/restaurants/${r.id}/menu` as Route} className="block truncate font-medium hover:underline">
                        {r.name}
                      </Link>
                      <span className="block truncate text-xs text-muted-foreground">/{r.slug}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{r.city || '-'}</TableCell>
                <TableCell className="tnum">
                  {r.dishCount}
                  {r.dishCount > 0 && <span className="text-muted-foreground"> · {r.liveCount} live</span>}
                </TableCell>
                <TableCell className="tnum hidden md:table-cell">{r.categoryCount}</TableCell>
                {portal === 'admin' && <TableCell className="tnum hidden md:table-cell">{r.managerCount}</TableCell>}
                <TableCell className="text-right">
                  <RestaurantRowMenu restaurantId={r.id} restaurantName={r.name} portal={portal} slug={r.slug} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
