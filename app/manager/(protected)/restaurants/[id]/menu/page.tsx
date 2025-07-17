import type { PageProps } from 'next'
import CategoryManager from '@/components/category-manager'
import { getMenu } from '@/app/actions/menu-actions'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function MenuPage({ params }: PageProps<{ id: string }>) {
  const { id } = params
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session.user.email } } },
    select: { id: true },
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  const data = await getMenu(id)
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Menu Categories</h2>
      <CategoryManager initialData={data} restaurantId={id} />
    </div>
  )
}
