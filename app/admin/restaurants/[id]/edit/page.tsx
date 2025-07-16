import prisma from '@/lib/prisma'
import EditRestaurantForm, { EditRestaurantValues } from '@/components/edit-restaurant-form'

export default async function EditRestaurantPage({ params }: { params: { id: string } }) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: params.id } })
  if (!restaurant) {
    return <div>Restaurant not found</div>
  }
  const defaultValues: EditRestaurantValues = {
    name: restaurant.name,
    slug: restaurant.slug,
    email: restaurant.email ?? '',
    phone: restaurant.phone ?? '',
    defaultLocale: restaurant.defaultLocale,
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Edit Restaurant</h2>
      <EditRestaurantForm id={restaurant.id} defaultValues={defaultValues} />
      <a
        href={`/admin/restaurants/${restaurant.id}/menu`}
        className="text-primary underline"
      >
        Manage Menu
      </a>
    </div>
  )
}
