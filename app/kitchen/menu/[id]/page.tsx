import { redirect } from 'next/navigation'
import { loadServiceMenu } from '@/lib/restaurant-loader'
import { restaurantIdFromParam } from '@/lib/restaurant-loader'
import { AvailabilityPage } from '@/components/availability/availability-page'

/** The tablet on the pass: what has run out. Outside any portal, like the board it sits beside. */
export default async function KitchenAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: param } = await params
  const id = await restaurantIdFromParam(param)
  const data = id ? await loadServiceMenu(id) : null
  if (!data) redirect('/kitchen/login')
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5">
      <AvailabilityPage data={data} backHref={`/kitchen/orders/${param}`} />
    </main>
  )
}
