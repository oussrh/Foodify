// components/orders/order-board.tsx
// The kitchen board a tablet sits on all day: this restaurant's open orders in two lanes, the
// alert when one arrives, and the details of any of them a tap away. It fills the screen — the
// portal's rail and tabs are not what a waiter needs at arm's length — and says plainly when it
// has lost the server rather than showing an empty room.
'use client'

import { useCallback, useState } from 'react'
import type { Route } from 'next'
import type { Money } from '@/lib/menu'
import type { BoardOrder, BoardView, OrderMove } from '@/lib/orders'
import { setOrderStatus } from '@/app/actions/order-actions'
import BoardHeader from './board-header'
import OrderColumns from './order-columns'
import OrderDetailsSheet from './order-details-sheet'
import ServedList from './served-list'
import { useChime } from './use-chime'
import { useSoundSetting } from '@/components/staff/use-sound-setting'
import ReadyDrawer from './ready-drawer'
import { useMinuteClock } from './use-minute-clock'
import { useOrderBoard } from './use-order-board'
import { useStaffPwa } from '@/components/staff/use-staff-pwa'
import { useWakeLock } from './use-wake-lock'

interface OrderBoardProps {
  restaurantId: string
  /** The restaurant's short code: what its own links are built from, never the uuid. */
  restaurantCode: string
  restaurantName: string
  /** The restaurant's currency, for the total in the details sheet. */
  money: Money
  /** Back to the rest of the portal, for whoever set the tablet up; absent on the tablet's own route. */
  backHref?: Route | undefined
}

export default function OrderBoard({ restaurantId, restaurantCode, restaurantName, money, backHref }: OrderBoardProps) {
  const { play: chime, prime } = useChime()
  // A pass wants sound: it is the whole reason the board is there, so it starts on. Turning it
  // off is a choice the room makes, remembered on the tablet.
  const sound = useSoundSetting('foodify-board-sound', true, prime)
  const announce = useCallback(() => {
    if (sound.on) chime()
  }, [sound.on, chime])
  const [view, setView] = useState<BoardView>('open')
  const { orders, online, loading, arrived, refresh } = useOrderBoard(restaurantId, view, announce)
  const wakeLock = useWakeLock()
  const pwa = useStaffPwa()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  // One clock for every card, so the waits tick without each one holding a timer.
  const now = useMinuteClock()

  // The open order is looked up rather than copied, so the sheet follows what the poll brings
  // back — and an order that left the board (served on another tablet) simply closes it.
  const openOrder = orders.find((order) => order.id === openId) ?? null

  // What the kitchen is working, and what is up waiting for the floor. The lanes show the first;
  // the second is behind the drawer, because it is the floor's job and not the pass's.
  const working = orders.filter((order) => order.status !== 'READY')
  const ready = orders.filter((order) => order.status === 'READY')

  const act = async (orderId: string, action: OrderMove) => {
    setBusyId(orderId)
    if (action !== 'accept') setOpenId(null)
    try {
      await setOrderStatus({ orderId, action })
      refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <BoardHeader
        restaurantName={restaurantName}
        view={view}
        onView={setView}
        openCount={orders.length}
        online={online}
        loading={loading}
        onRefresh={refresh}
        soundOn={sound.on}
        onToggleSound={sound.toggle}
        readyDrawer={<ReadyDrawer orders={ready} now={now} busyId={busyId} onDeliver={(order) => act(order.id, 'done')} />}
        wakeLock={wakeLock}
        pwa={pwa}
        backHref={backHref}
        soldOutHref={`/kitchen/menu/${restaurantCode}` as Route}
      />

      <main className="flex-1 px-3 py-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-4">
        {/* The count is announced, so staff who are not watching still hear the board change. */}
        <p className="sr-only" role="status" aria-live="polite">
          {loading ? 'Loading orders' : `${orders.length} open order${orders.length === 1 ? '' : 's'}`}
        </p>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-28 text-center">
            <p className="text-xl font-semibold">
              {loading ? 'Loading orders…' : view === 'open' ? 'No open orders' : 'Nothing served yet'}
            </p>
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {view === 'open' ? 'New orders appear here on their own, with a chime.' : 'Orders you have served or cancelled are listed here.'}
              </p>
            )}
          </div>
        ) : view === 'open' ? (
          <OrderColumns
            orders={working}
            now={now}
            busyId={busyId}
            arrived={arrived}
            onOpen={(order: BoardOrder) => setOpenId(order.id)}
            // One button per card, and which move it makes is the lane it is in: start it, call
            // it up, or mark it carried out.
            onAdvance={(order: BoardOrder) => act(order.id, order.status === 'NEW' ? 'accept' : order.status === 'ACCEPTED' ? 'ready' : 'done')}
          />
        ) : (
          <ServedList orders={orders} money={money} onOpen={(order: BoardOrder) => setOpenId(order.id)} />
        )}
      </main>

      <OrderDetailsSheet
        order={openOrder}
        onClose={() => setOpenId(null)}
        onAction={(action) => openOrder && act(openOrder.id, action)}
        busy={busyId !== null}
        money={money}
        now={now}
      />
    </div>
  )
}
