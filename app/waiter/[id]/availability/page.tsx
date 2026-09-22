import { redirect } from 'next/navigation'
import { loadServiceMenu } from '@/lib/restaurant-loader'
import { AvailabilityPage } from '@/components/availability/availability-page'
import { WaiterNav } from '@/components/waiter/waiter-nav'

/** The waiter's phone: mark a dish off the moment the kitchen says so, from the floor. */
export default async function WaiterAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await loadServiceMenu(id)
  if (!data) redirect('/waiter/login')
  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-4 py-5">
        <AvailabilityPage data={data} backHref={`/waiter/${id}`} padded />
      </main>
      <WaiterNav restaurantId={id} active="soldOut" />
    </>
  )
}
