import Link from 'next/link'
import type { PageProps } from '@/types/page'
import prisma from '@/lib/prisma'
import EditClientForm, { EditClientValues } from '@/components/edit-client-form'
import { buttonVariants } from '@/components/ui/button'

export default async function EditUserPage({ params }: PageProps<{ id: string }>) {
  const { id } = params
  const user = await prisma.user.findUnique({
    where: { id },
    include: { restaurants: true },
  })
  if (!user) {
    return <div>User not found</div>
  }
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  const defaultValues: EditClientValues = {
    email: user.email,
    restaurantIds: user.restaurants.map((r) => r.id),
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Edit User</h2>
        <Link
          href={`/admin/users/${user.id}/restaurants`}
          className={buttonVariants({ variant: 'outline' })}
        >
          Manage Restaurants
        </Link>
      </div>
      <EditClientForm
        id={user.id}
        defaultValues={defaultValues}
        restaurants={restaurants}
      />
    </div>
  )
}
