import type { Route } from 'next'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import CreateDishForm from '@/components/create-dish-form'
import { PageHeader } from '@/components/shell/page-header'

export default async function CreateDishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/admin/login')

  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) redirect('/admin/restaurants')

  const categories = await prisma.menuCategory.findMany({
    where: { restaurantId: restaurant.id },
    include: { subcategories: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  })
  const subcategories = categories.flatMap((category) =>
    category.subcategories.map((sub) => ({ id: sub.id, nameEn: `${category.nameEn} → ${sub.nameEn}` })),
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="New dish"
        description={`It appears on ${restaurant.name}'s menu as soon as it is saved and live.`}
        back={{ href: `/admin/restaurants/${restaurant.id}/dishes` as Route, label: 'All dishes' }}
      />
      <CreateDishForm restaurantId={restaurant.id} subcategories={subcategories} restaurantName={restaurant.name} />
    </div>
  )
}
