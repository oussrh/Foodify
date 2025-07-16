import prisma from '@/lib/prisma'
import EditClientForm, { EditClientValues } from '@/components/edit-client-form'

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: { restaurant: true },
  })
  if (!user) {
    return <div>User not found</div>
  }
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  const defaultValues: EditClientValues = {
    email: user.email,
    restaurantId: user.restaurant?.id ?? undefined,
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Edit User</h2>
      <EditClientForm id={user.id} defaultValues={defaultValues} restaurants={restaurants} />
    </div>
  )
}
