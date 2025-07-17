import Link from 'next/link'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import EditRestaurantForm, { EditRestaurantValues } from '@/components/edit-restaurant-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'

export default async function EditRestaurantPage({ params }: { params: { id: string } }) {
  const { id } = params
  const session = await auth()
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session!.user.email } } },
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  const defaultValues: EditRestaurantValues = {
    name: restaurant.name,
    slug: restaurant.slug,
    email: restaurant.email ?? '',
    phone: restaurant.phone ?? '',
    defaultLocale: restaurant.defaultLocale,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Edit Restaurant</h2>
        <div className="flex gap-2">
          <Link
            href={`/restaurant/${restaurant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: 'secondary' })}
          >
            View Public Page
          </Link>
          <Link href="/manager/restaurants" className={buttonVariants({ variant: 'outline' })}>
            Back to Restaurants
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{restaurant.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditRestaurantForm id={restaurant.id} defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  )
}
