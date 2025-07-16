import Link from 'next/link'
import prisma from '@/lib/prisma'
import { buttonVariants } from '@/components/ui/button'
import DeleteRestaurantButton from '@/components/delete-restaurant-button'

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Restaurants</h2>
      <Link href="/admin/restaurants/create" className={buttonVariants()}>
        Create Restaurant
      </Link>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="px-2 py-1">Name</th>
              <th className="px-2 py-1">Slug</th>
              <th className="px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/50">
                <td className="px-2 py-1">{r.name}</td>
                <td className="px-2 py-1">{r.slug}</td>
                <td className="flex gap-2 px-2 py-1">
                  <a href={`/admin/restaurants/${r.id}/edit`} className="text-primary underline">
                    Edit
                  </a>
                  <DeleteRestaurantButton id={r.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
