import { notFound, redirect } from 'next/navigation'
import { loadServiceMenu, restaurantIdFromParam } from '@/lib/restaurant-loader'
import { AvailabilityPage } from '@/components/availability/availability-page'
import { WaiterNav } from '@/components/waiter/waiter-nav'

/** The waiter's phone: mark a dish off the moment the kitchen says so, from the floor. */
export default async function WaiterAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: param } = await params
  const id = await restaurantIdFromParam(param) ?? notFound()
  const data = await loadServiceMenu(id)
  if (!data) redirect('/waiter/login')
  return (
    <>
      <main className="mx-auto w-full max-w-3xl px-4 py-5">
        <AvailabilityPage data={data} backHref={`/waiter/${param}`} padded />
      </main>
      <WaiterNav restaurantId={param} active="soldOut" />
    </>
  )
}
