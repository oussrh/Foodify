import Link from 'next/link'
import type { Route } from 'next'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, StatStrip } from '@/components/shell/page-header'
import { getMenu } from '@/app/actions/menu-actions'
import ManagerCategoryManager from '@/components/manager-category-manager'

export default async function MenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/manager/login')

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session.user.email } } },
    select: { id: true, name: true, dishes: { select: { id: true, isActive: true, subcategoryId: true } } },
  })
  if (!restaurant) redirect('/manager/restaurants')

  const data = await getMenu(id)
  const total = restaurant.dishes.length
  const live = restaurant.dishes.filter((d) => d.isActive).length
  const uncategorized = restaurant.dishes.filter((d) => !d.subcategoryId).length
  const subcategories = data.reduce((n, c) => n + c.subcategories.length, 0)
  const base = `/manager/restaurants/${restaurant.id}`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Menu"
        description="Categories and sections, in the order diners see them."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`${base}/dishes` as Route}>All dishes</Link>
            </Button>
            <Button asChild>
              <Link href={`${base}/dishes/create` as Route}>
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
      <ManagerCategoryManager initialData={data} restaurantId={id} />
    </div>
  )
}
