import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { SettingsScreen } from '@/components/restaurant-form/settings-screen'
import { AdminDeleteRestaurantButton } from '@/components/admin-delete-restaurant-button'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { idSegment, routeParams } from '@/lib/schemas/page-params'
import { loadPosView } from '@/server/pos/view'

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const { id } = routeParams(idSegment, await params)

  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) redirect('/admin/restaurants')

  return (
    <SettingsScreen restaurant={restaurant} pos={await loadPosView(restaurant.id)} canEnablePos>
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
    </SettingsScreen>
  )
}
