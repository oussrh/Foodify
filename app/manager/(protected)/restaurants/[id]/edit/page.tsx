import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import EditRestaurantForm, { type EditRestaurantValues } from '@/components/edit-restaurant-form'
import { PageHeader } from '@/components/shell/page-header'

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/manager/login')

  const restaurant = await prisma.restaurant.findFirst({ where: { id, users: { some: { email: session.user.email } } } })
  if (!restaurant) redirect('/manager/restaurants')

  const defaultValues: EditRestaurantValues = {
    name: restaurant.name,
    slug: restaurant.slug,
    email: restaurant.email ?? '',
    phone: restaurant.phone ?? '',
    tagline: restaurant.tagline ?? '',
    logoUrl: restaurant.logoUrl ?? '',
    colorTheme: restaurant.colorTheme ?? '',
    defaultLocale: restaurant.defaultLocale,
    streetAddress: restaurant.streetAddress ?? '',
    city: restaurant.city ?? '',
    state: restaurant.state ?? '',
    postalCode: restaurant.postalCode ?? '',
    country: restaurant.country ?? '',
    website: restaurant.website ?? '',
    description: restaurant.description ?? '',
    cuisineType: restaurant.cuisineType ?? '',
    priceRange: restaurant.priceRange as '$' | '$$' | '$$$' | '$$$$' | undefined,
    openingHours: restaurant.openingHours ?? '',
    socialMedia: restaurant.socialMedia ?? '',
    coverImageUrl: restaurant.coverImageUrl ?? '',
    coverImageStyle: restaurant.coverImageStyle as 'cover' | 'repeat' | undefined,
    secondaryColor: restaurant.secondaryColor ?? '',
    fontFamily: restaurant.fontFamily ?? '',
    googleFontUrl: restaurant.googleFontUrl ?? '',
    currency: restaurant.currency ?? '',
    currencySymbol: restaurant.currencySymbol ?? '',
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-2">
      <PageHeader title="Settings" description="Name, address, hours, branding and currency. Changes go live on the public menu as soon as you save." />
      <EditRestaurantForm id={restaurant.id} defaultValues={defaultValues} />
    </div>
  )
}
