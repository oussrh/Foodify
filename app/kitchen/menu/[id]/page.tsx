import { redirect } from 'next/navigation'
import { loadServiceMenu } from '@/lib/restaurant-loader'
import { AvailabilityPage } from '@/components/availability/availability-page'

/** The tablet on the pass: what has run out. Outside any portal, like the board it sits beside. */
export default async function KitchenAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadServiceMenu(id)
  if (!data) redirect('/kitchen/login')
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5">
      <AvailabilityPage data={data} backHref={`/kitchen/orders/${id}`} />
    </main>
  )
}
