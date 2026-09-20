import prisma from '@/lib/prisma'
import EditClientForm, { type EditClientValues } from '@/components/edit-client-form'
import { UserEditAside, type UserStats } from '@/components/admin/user-edit-aside'
import { UserEditHeader } from '@/components/admin/user-edit-header'
import { redirect } from 'next/navigation'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireSuperAdminPage()
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: { 
      restaurants: {
        include: {
          dishes: {
            select: {
              id: true,
              isActive: true
            }
          },
          categories: {
            select: {
              id: true
            }
          }
        }
      }
    },
  })
  
  if (!user) {
    redirect('/admin/users')
  }
  
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  const defaultValues: EditClientValues = {
    email: user.email,
    restaurantIds: user.restaurants.map((r) => r.id),
  }

  // Calculate user statistics
  const stats: UserStats = {
    totalRestaurants: user.restaurants.length,
    totalDishes: user.restaurants.reduce((acc, r) => acc + r.dishes.length, 0),
    activeDishes: user.restaurants.reduce((acc, r) => acc + r.dishes.filter((d) => d.isActive).length, 0),
    totalCategories: user.restaurants.reduce((acc, r) => acc + r.categories.length, 0),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <UserEditHeader id={user.id} email={user.email} totalRestaurants={stats.totalRestaurants} totalDishes={stats.totalDishes} />

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Left Column - Edit Form */}
        <div className="xl:col-span-2">
          <EditClientForm
            id={user.id}
            defaultValues={defaultValues}
            restaurants={restaurants}
          />
        </div>

        {/* Right Column - User Info & Actions */}
        <UserEditAside id={user.id} createdAt={user.createdAt} restaurants={user.restaurants} stats={stats} />
      </div>
    </div>
  )
}
