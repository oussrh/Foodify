import Link from 'next/link'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, StatStrip } from '@/components/shell/page-header'
import { getMenu } from '@/app/actions/menu-actions'
import AdminCategoryManager from '@/components/admin-category-manager'
import { requireSuperAdminPage } from '@/lib/auth-guard'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'

export default async function MenuPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdminPage()
  const id = await restaurantPageId((await params).id, (code) => restaurantPath('admin', code, 'menu'))

  const restaurant = await prisma.restaurant.findUnique({ where: { id }, select: { id: true, code: true, name: true, dishes: { select: { id: true, isActive: true, subcategoryId: true } } } })
  if (!restaurant) redirect('/admin/restaurants')

  const data = await getMenu(id)
  const total = restaurant.dishes.length
  const live = restaurant.dishes.filter((d) => d.isActive).length
  const uncategorized = restaurant.dishes.filter((d) => !d.subcategoryId).length
  const subcategories = data.reduce((n, c) => n + c.subcategories.length, 0)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Menu"
        description="Categories and sections, in the order diners see them."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={restaurantPath('admin', restaurant.code, 'dishes')}>All dishes</Link>
            </Button>
            <Button asChild>
              <Link href={restaurantPath('admin', restaurant.code, 'dishes/create')}>
                <Plus className="h-4 w-4" />
                Add dish
              </Link>
            </Button>
          </>
        }
      />
      <StatStrip
        stats={[
          { label: 'Categories', value: data.length, hint: subcategories > 0 ? `${subcategories} section${subcategories === 1 ? '' : 's'}` : undefined },
          { label: 'Dishes', value: total, hint: total > 0 ? `${live} live` : undefined },
          { label: 'Without a section', value: uncategorized },
        ]}
      />
      <AdminCategoryManager initialData={data} restaurantId={id} />
    </div>
  )
}
