import Link from 'next/link'
import type { Route } from 'next'
import Image from 'next/image'
import { Search, Utensils } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shell/page-header'
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
  role: 'admin' | 'manager'
  rows: RestaurantListRow[]
  search: string
  emptyAction?: React.ReactNode
}

/** Search box (GET) plus the table. Server-renderable. */
export default function RestaurantsList({ role, rows, search, emptyAction }: RestaurantsListProps) {
  return (
    <div className="flex flex-col gap-4">
      <form method="get" className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -/2 text-muted-foreground" />
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search restaurants"
          aria-label="Search restaurants"
          className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={search ? `Nothing matches “${search}”` : 'No restaurants yet'}
          description={search ? 'Try a shorter word, or clear the search.' : undefined}
          action={search ? <Link href={`/${role}/restaurants` as Route} className="text-sm font-medium text-primary hover:underline">Clear search</Link> : emptyAction}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant</TableHead>
              <TableHead className="hidden sm:table-cell">City</TableHead>
              <TableHead>Dishes</TableHead>
              <TableHead className="hidden md:table-cell">Categories</TableHead>
              {role === 'admin' && <TableHead className="hidden md:table-cell">Managers</TableHead>}
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
                      <Link href={`/${role}/restaurants/${r.id}/menu` as Route} className="block truncate font-medium hover:underline">
                        {r.name}
                      </Link>
                      <span className="block truncate text-xs text-muted-foreground">/{r.slug}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{r.city || '—'}</TableCell>
                <TableCell className="tnum">
                  {r.dishCount}
                  {r.dishCount > 0 && <span className="text-muted-foreground"> · {r.liveCount} live</span>}
                </TableCell>
                <TableCell className="tnum hidden md:table-cell">{r.categoryCount}</TableCell>
                {role === 'admin' && <TableCell className="tnum hidden md:table-cell">{r.managerCount}</TableCell>}
                <TableCell className="text-right">
                  <RestaurantRowMenu restaurantId={r.id} restaurantName={r.name} role={role} slug={r.slug} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
