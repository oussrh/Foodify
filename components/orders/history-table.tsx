// components/orders/history-table.tsx
// The restaurant's recent orders as a record rather than a job list: what each one was, where it
// got to, and the three times that say how the kitchen did — when it was placed, how long the
// table waited before it was taken on, and how long until it went out. A row opens the same
// details sheet the board uses, so the lines and the notes are one click away.
'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { formatPrice, type Money } from '@/lib/menu'
import { itemCount, orderTimings, STATUS_LABEL, type BoardOrder, type OrderStatus } from '@/lib/orders'
import { additionLabel } from '@/lib/table-tab'
import OrderDetailsSheet from './order-details-sheet'

const STATUS_VARIANT: Record<OrderStatus, BadgeProps['variant']> = {
  NEW: 'default',
  ACCEPTED: 'secondary',
  READY: 'warning',
  DONE: 'success',
  CANCELLED: 'outline',
}

const CLOCK: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
const DAY: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }

/** A duration in minutes as the table prints it, or a dash while that stage has not happened. */
function minutes(value: number | null) {
  return value === null ? <span className="text-muted-foreground">—</span> : <>{value} min</>
}

/**
 * Recent orders as a record: what each was, where it got to, and how long it waited to be taken on
 * and to go out; a row opens the details sheet.
 */
export default function HistoryTable({ orders, money }: { orders: BoardOrder[]; money: Money }) {
  const [openId, setOpenId] = useState<string | null>(null)
  // A history does not tick: the clock is read once, at mount, rather than on every render.
  const [now] = useState(() => Date.now())
  const open = orders.find((order) => order.id === openId) ?? null

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="hidden sm:table-cell">Placed</TableHead>
            <TableHead className="hidden lg:table-cell">Taken on</TableHead>
            <TableHead className="hidden lg:table-cell">Served</TableHead>
            <TableHead className="hidden md:table-cell">Waited</TableHead>
            <TableHead className="hidden md:table-cell">Made in</TableHead>
            <TableHead>Total time</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const timings = orderTimings(order)
            const placed = new Date(order.createdAt)
            return (
              <TableRow key={order.id} className="cursor-pointer" onClick={() => setOpenId(order.id)}>
                <TableCell>
                  <button type="button" className="text-left font-medium hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
                    Table {order.table}
                  </button>
                  <span className="tnum block text-xs text-muted-foreground">
                    #{order.number} · {itemCount(order)} item{itemCount(order) === 1 ? '' : 's'}
                  </span>
                  {additionLabel(order) && <span className="block text-xs font-medium">{additionLabel(order)}</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                </TableCell>
                <TableCell className="tnum hidden text-muted-foreground sm:table-cell">
                  {placed.toLocaleTimeString('en-GB', CLOCK)}
                  <span className="block text-xs">{placed.toLocaleDateString('en-GB', DAY)}</span>
                </TableCell>
                <TableCell className="tnum hidden text-muted-foreground lg:table-cell">
                  {order.acceptedAt ? new Date(order.acceptedAt).toLocaleTimeString('en-GB', CLOCK) : '—'}
                </TableCell>
                <TableCell className="tnum hidden text-muted-foreground lg:table-cell">
                  {order.servedAt ? new Date(order.servedAt).toLocaleTimeString('en-GB', CLOCK) : '—'}
                </TableCell>
                <TableCell className="tnum hidden md:table-cell">{minutes(timings.toStart)}</TableCell>
                <TableCell className="tnum hidden md:table-cell">{minutes(timings.toServe)}</TableCell>
                <TableCell className="tnum font-medium">{minutes(timings.total)}</TableCell>
                <TableCell className="tnum text-right">{formatPrice(order.subtotal, money)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* The same sheet the board opens, without its moves: this is a record, not a job. */}
      <OrderDetailsSheet order={open} onClose={() => setOpenId(null)} onAction={() => undefined} busy money={money} now={now} readOnly />
    </>
  )
}
