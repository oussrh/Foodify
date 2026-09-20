import Link from 'next/link'
import type { Route } from 'next'
import Image from 'next/image'
import { Camera, Search, Star } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shell/page-header'
import { DishLiveSwitch, DishRowMenu } from '@/components/shell/row-actions'
import { cn } from '@/lib/utils'

export interface DishListRow {
  id: string
  nameEn: string
  nameFr: string
  imageUrl: string
  /** A two-decimal string, as money travels (API.1). */
  price: string
  isActive: boolean
  isMostPurchased: boolean
  hasAR: boolean
  category: string | null
  createdAt: Date
}

interface DishesListProps {
  role: 'admin' | 'manager'
  restaurantId: string
  currency: string
  rows: DishListRow[]
  search: string
  emptyAction?: React.ReactNode
}

export default function DishesList({ role, restaurantId, currency, rows, search, emptyAction }: DishesListProps) {
  const base = `/${role}/restaurants/${restaurantId}`
  return (
    <div className="flex flex-col gap-4">
      <form method="get" className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -/2 text-muted-foreground" />
        <input
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Search dishes"
          aria-label="Search dishes"
          className="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        />
      </form>

      {rows.length === 0 ? (
        <EmptyState
          title={search ? `Nothing matches “${search}”` : 'No dishes yet'}
          description={search ? 'Try a shorter word, or clear the search.' : 'Add the first dish and it will show on the public menu as soon as it is live.'}
          action={
            search ? (
              <Link href={`${base}/dishes` as Route} className="text-sm font-medium text-primary hover:underline">
                Clear search
              </Link>
            ) : (
              emptyAction
            )
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[1%]">
                <span className="sr-only">Photo</span>
              </TableHead>
              <TableHead>Dish</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="hidden sm:table-cell">AR</TableHead>
              <TableHead>Live</TableHead>
              <TableHead className="hidden lg:table-cell">Added</TableHead>
              <TableHead className="w-[1%]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((d) => (
              <TableRow key={d.id} className={cn(!d.isActive && 'text-muted-foreground')}>
                <TableCell className="pr-0">
                  <span className="relative block h-10 w-10 overflow-hidden rounded-md bg-muted">
                    <Image src={d.imageUrl} alt="" fill sizes="40px" className={cn('object-cover', !d.isActive && 'opacity-60')} />
                  </span>
                </TableCell>
                <TableCell>
                  <Link href={`${base}/dishes/${d.id}/edit` as Route} className="flex items-center gap-1.5 font-medium text-foreground hover:underline">
                    <span className="truncate">{d.nameEn}</span>
                    {d.isMostPurchased && <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" aria-label="Popular" />}
                  </Link>
                  <span className="block truncate text-xs text-muted-foreground">{d.nameFr}</span>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{d.category || '—'}</TableCell>
                <TableCell className="tnum text-right">
                  {currency}
                  {d.price}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {d.hasAR ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                      <Camera className="h-3.5 w-3.5" />
                      Ready
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <DishLiveSwitch dishId={d.id} isActive={d.isActive} />
                </TableCell>
                <TableCell className="tnum hidden text-muted-foreground lg:table-cell">
                  {d.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </TableCell>
                <TableCell className="text-right">
                  <DishRowMenu dishId={d.id} dishName={d.nameEn} editHref={`${base}/dishes/${d.id}/edit` as Route} isMostPurchased={d.isMostPurchased} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
