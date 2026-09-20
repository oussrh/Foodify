import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import EditRestaurantForm from '@/components/edit-restaurant-form'
import { restaurantFormValues } from '@/components/forms/form-defaults'
import { PageHeader } from '@/components/shell/page-header'

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/manager/login')

  const restaurant = await prisma.restaurant.findFirst({ where: { id, users: { some: { email: session.user.email } } } })
  if (!restaurant) redirect('/manager/restaurants')

  const defaultValues = restaurantFormValues(restaurant)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      <PageHeader title="Settings" description="Name, address, hours, branding and currency. Changes go live on the public menu as soon as you save." />
      <EditRestaurantForm id={restaurant.id} defaultValues={defaultValues} />
    </div>
  )
}
