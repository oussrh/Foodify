import CreateAdminForm from '@/components/create-admin-form'
import { AdminCreateAside } from '@/components/admin/admin-create-aside'
import { AdminCreateHeader } from '@/components/admin/admin-create-header'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function CreateAdminPage() {
  await requireSuperAdminPage()
  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminCreateHeader />

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Create Form */}
        <div className="xl:col-span-2">
          <CreateAdminForm />
        </div>

        {/* Right Column - Info & Tips */}
        <AdminCreateAside />
      </div>
    </div>
  )
}
