// components/menu/tracking/order-tracker.tsx
// "Your order #12": where the guest's order is (a status in words, then the steps with the time
// each was reached), which table it goes to, and the dishes still coming with the subtotal. It
// follows the order while the page is in view (use-order-tracking.ts), keeps the device's list of
// orders up to date as it goes, and says so when the phone is offline rather than going blank.
'use client'

import { guestStatus, isFinished, stepViews } from '@/lib/guest-status'
import { formatPrice, type Locale, type MenuRestaurant } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import type { TrackedOrder } from '@/lib/schemas/order-tracking'
import OrderSteps from './order-steps'
import { useGuestOrders } from './use-guest-orders'
import { useOrderTracking } from './use-order-tracking'

type TrackerRestaurant = Pick<MenuRestaurant, 'id' | 'slug' | 'currencySymbol' | 'currency'>

/** The dishes still coming and what they come to. */
function OrderLines({ order, restaurant, locale }: { order: TrackedOrder; restaurant: TrackerRestaurant; locale: Locale }) {
  const t = MENU_TEXT[locale]
  const money = { locale, symbol: restaurant.currencySymbol, code: order.currency ?? restaurant.currency }
  return (
    <section aria-labelledby="tracked-lines" className="rounded-lg border border-border bg-card px-4 py-3">
      <h2 id="tracked-lines" className="text-sm font-semibold">
        {t.yourOrder}
      </h2>
      <ul className="divide-y divide-border">
        {order.lines.map((line, i) => (
          <li key={`${i}-${line.nameEn}`} className="flex gap-3 py-2.5 text-[15px]">
            <span className="tnum w-7 shrink-0 font-semibold">{line.quantity}×</span>
            <span className="min-w-0 flex-1">{locale === 'fr' ? line.nameFr : line.nameEn}</span>
          </li>
        ))}
      </ul>
      <p className="flex justify-between border-t border-border pt-3 text-[15px] font-semibold">
        <span>{t.subtotal}</span>
        <span className="tnum">{formatPrice(order.subtotal, money)}</span>
      </p>
    </section>
  )
}

/** Where the order is: the status in words, then the steps (or why there are none). */
function OrderProgress({ order, locale }: { order: TrackedOrder; locale: Locale }) {
  const t = MENU_TEXT[locale]
  const status = guestStatus(order.status)
  const steps = stepViews(order)
  // A bill closed while the ticket was still open (paid, the table let go): nothing more is followed.
  const closedEarly = order.closed && !isFinished(order.status)
  return (
    <>
      <p role="status" className="rounded-lg bg-brand-tint px-4 py-3 text-lg font-semibold text-brand">
        {closedEarly ? t.billClosed : t.orderStatus[status]}
      </p>
      {steps ? <OrderSteps steps={steps} locale={locale} /> : <p className="text-sm text-muted-foreground">{t.orderCancelledHint}</p>}
      {closedEarly && <p className="text-sm text-muted-foreground">{t.billClosedHint}</p>}
      {status === 'served' && <p className="text-sm text-muted-foreground">{t.orderServedHint}</p>}
    </>
  )
}

interface ContentProps {
  order: TrackedOrder | null
  gone: boolean
  online: boolean
  restaurant: TrackerRestaurant
  locale: Locale
}

/** What there is to show: the order, or that it cannot be found, or that it is being asked for (nothing more when offline, which is said above). */
function TrackerContent({ order, gone, online, restaurant, locale }: ContentProps) {
  const t = MENU_TEXT[locale]
  if (gone) return <p className="text-[15px] text-muted-foreground">{t.trackingGone}</p>
  if (!order) return online ? <p className="text-[15px] text-muted-foreground">{t.trackingLoading}</p> : null
  return (
    <>
      <OrderProgress order={order} locale={locale} />
      <OrderLines order={order} restaurant={restaurant} locale={locale} />
    </>
  )
}

/** The guest's order named by `token`, followed live; an order of another restaurant reads as not found. */
export default function OrderTracker({ token, restaurant, locale }: { token: string; restaurant: TrackerRestaurant; locale: Locale }) {
  const t = MENU_TEXT[locale]
  const guest = useGuestOrders(restaurant.id)
  const tracking = useOrderTracking(
    token,
    (order) => guest.setStatus(token, order),
    () => guest.forget(token),
  )
  // A secret of another restaurant's order opens that order under that restaurant's menu only.
  const order = tracking.order?.restaurant.slug === restaurant.slug ? tracking.order : null
  const gone = tracking.gone || (tracking.order !== null && !order)

  return (
    <div className="space-y-5 pt-2">
      <div>
        <h1 className="text-2xl font-semibold">{order ? t.yourOrderNumber(order.number) : t.yourOrder}</h1>
        {order && <p className="text-sm text-muted-foreground">{t.atTable(order.table)}</p>}
      </div>
      {(!tracking.online || tracking.outdated) && (
        <p role="status" className="rounded-md bg-warning/15 px-3 py-2 text-sm font-medium text-warning">
          {tracking.outdated ? t.trackingOutdated : t.trackingOffline}
        </p>
      )}
      <TrackerContent order={order} gone={gone} online={tracking.online} restaurant={restaurant} locale={locale} />
    </div>
  )
}
