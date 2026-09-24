import prisma from '@/lib/prisma'
import EditAdminForm, { type EditAdminValues } from '@/components/edit-admin-form'
import { AdminEditAside } from '@/components/admin/admin-edit-aside'
import { AdminEditHeader } from '@/components/admin/admin-edit-header'
import { redirect } from 'next/navigation'
import { daysSince } from '@/lib/time'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { idSegment, routeParams } from '@/lib/schemas/page-params'

export default async function EditAdminPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  await requireSuperAdminPage()
  const { id } = routeParams(idSegment, await params)
  const admin = await prisma.user.findUnique({ where: { id } })
  
  if (!admin) {
    redirect('/admin/admins')
  }
  
  const defaultValues: EditAdminValues = { email: admin.email }
  
  // Calculate admin statistics
  const adminAge = daysSince(admin.createdAt)
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminEditHeader email={admin.email} adminAge={adminAge} />

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Edit Form */}
        <div className="xl:col-span-2">
          <EditAdminForm id={admin.id} defaultValues={defaultValues} />
        </div>

        {/* Right Column - Admin Info & Actions */}
        <AdminEditAside id={admin.id} createdAt={admin.createdAt} adminAge={adminAge} />
      </div>
    </div>
  )
}
