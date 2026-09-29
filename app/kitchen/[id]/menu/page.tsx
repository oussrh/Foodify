import { notFound, redirect } from 'next/navigation'
import { loadServiceMenu, restaurantIdFromParam } from '@/lib/restaurant-loader'
import { isKitchenWord, kitchenBoardPath } from '@/lib/restaurant-paths'
import { AvailabilityPage } from '@/components/availability/availability-page'

/**
 * The tablet on the pass: what has run out, at `/kitchen/<code>/menu`, beside the board it goes
 * back to. Outside any portal, like the board. `/kitchen/menu/<code>`, its address until the
 * kitchen's routes put the restaurant first, still serves this page (a rewrite in next.config.js).
 */
export default async function KitchenAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: param } = await params
  if (isKitchenWord(param)) notFound()
  const id = await restaurantIdFromParam(param) ?? notFound()
  const data = await loadServiceMenu(id)
  if (!data) redirect('/kitchen/login')
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5">
      <AvailabilityPage data={data} backHref={kitchenBoardPath(param)} />
    </main>
  )
}
