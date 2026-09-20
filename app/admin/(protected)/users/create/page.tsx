import prisma from '@/lib/prisma'
import CreateClientForm from '@/components/create-client-form'
import { UserCreateAside } from '@/components/admin/user-create-aside'
import { UserCreateHeader } from '@/components/admin/user-create-header'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function CreateUserPage() {
  await requireSuperAdminPage()
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="space-y-8">
      {/* Header */}
      <UserCreateHeader restaurantCount={restaurants.length} />

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Create Form */}
        <div className="xl:col-span-2">
          <CreateClientForm restaurants={restaurants} />
        </div>

        {/* Right Column - Info & Tips */}
        <UserCreateAside restaurants={restaurants} />
      </div>
    </div>
  )
}
