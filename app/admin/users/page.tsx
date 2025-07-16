import CreateClientForm from '@/components/create-client-form'
import prisma from '@/lib/prisma'

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    where: { role: 'RESTAURANT_ADMIN' },
    include: { restaurant: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Clients</h2>
      <CreateClientForm />
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-2 py-1">Email</th>
              <th className="px-2 py-1">Restaurant</th>
              <th className="px-2 py-1">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b hover:bg-muted/50">
                <td className="px-2 py-1">{u.email}</td>
                <td className="px-2 py-1">{u.restaurant?.name ?? '-'}</td>
                <td className="px-2 py-1">{u.createdAt.toDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
