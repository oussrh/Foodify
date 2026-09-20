import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EditRestaurantForm from '@/components/edit-restaurant-form'
import { restaurantFormValues } from '@/components/forms/form-defaults'
import { PageHeader } from '@/components/shell/page-header'
import { AdminDeleteRestaurantButton } from '@/components/admin-delete-restaurant-button'
import { requireSuperAdminPage } from '@/lib/auth-guard'

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const { id } = await params

  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) redirect('/admin/restaurants')

  const defaultValues = restaurantFormValues(restaurant)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      <PageHeader title="Settings" description="Name, address, hours, branding and currency. Changes go live on the public menu as soon as you save." />
      <EditRestaurantForm id={restaurant.id} defaultValues={defaultValues} />

      <section className="mt-10 flex flex-col gap-3 rounded-lg border border-destructive/40 p-5">
        <div>
          <h2 className="text-base font-semibold text-destructive">Delete this restaurant</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Removes the menu, every dish and its QR codes. Managers keep their accounts. This cannot be undone.
          </p>
        </div>
        <div>
          <AdminDeleteRestaurantButton restaurantId={restaurant.id} restaurantName={restaurant.name} />
        </div>
      </section>
    </div>
  )
}
