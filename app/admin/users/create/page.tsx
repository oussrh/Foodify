import prisma from '@/lib/prisma'
import CreateClientForm from '@/components/create-client-form'

export default async function CreateUserPage() {
  const restaurants = await prisma.restaurant.findMany({ orderBy: { name: 'asc' } })
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Create User</h2>
      <CreateClientForm restaurants={restaurants} />
    </div>
  )
}
