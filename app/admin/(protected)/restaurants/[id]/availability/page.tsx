import { redirect } from 'next/navigation'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { loadServiceMenu } from '@/lib/restaurant-loader'
import { AvailabilityPage } from '@/components/availability/availability-page'

/** The same screen a manager sees; the loader's guard admits a super admin to any restaurant. */
export default async function AdminAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const data = await loadServiceMenu((await params).id)
  if (!data) redirect('/admin/restaurants')
  return <AvailabilityPage data={data} />
}
