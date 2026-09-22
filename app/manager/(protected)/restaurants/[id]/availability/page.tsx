import { redirect } from 'next/navigation'
import { loadServiceMenu } from '@/lib/restaurant-loader'
import { AvailabilityPage } from '@/components/availability/availability-page'

/** The same screen the pass and the floor use, inside the portal shell. */
export default async function ManagerAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const data = await loadServiceMenu((await params).id)
  if (!data) redirect('/manager/restaurants')
  return <AvailabilityPage data={data} />
}
