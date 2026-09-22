import { redirect } from 'next/navigation'
import { loadServiceMenu } from '@/lib/restaurant-loader'
import { AvailabilityPage } from '@/components/availability/availability-page'

/** The waiter's phone: mark a dish off the moment the kitchen says so, from the floor. */
export default async function WaiterAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await loadServiceMenu((await params).id)
  if (!data) redirect('/waiter/login')
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-5">
      <AvailabilityPage data={data} />
    </main>
  )
}
