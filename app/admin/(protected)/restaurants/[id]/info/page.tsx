import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader, StatStrip } from '@/components/shell/page-header'
import QRCodeDisplay from '@/components/qr-code-display'
import { daysAgo } from '@/lib/time'

export default async function RestaurantInfoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/admin/login')

  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) redirect('/admin/restaurants')

  const since = daysAgo(30)
  const [views, arViews, recent, dishes] = await Promise.all([
    prisma.dishView.count({ where: { dish: { restaurantId: restaurant.id } } }),
    prisma.dishView.count({ where: { dish: { restaurantId: restaurant.id }, arViewed: true } }),
    prisma.dishView.count({ where: { dish: { restaurantId: restaurant.id }, viewedAt: { gte: since } } }),
    prisma.dish.count({ where: { restaurantId: restaurant.id, isActive: true } }),
  ])

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://foodify.app'}/restaurant/${restaurant.slug}`

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Public menu"
        description="The link and QR code diners use, and how often they open it."
        actions={
          <Button asChild variant="outline">
            <a href={publicUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Open menu
            </a>
          </Button>
        }
      />

      <StatStrip
        stats={[
          { label: 'Live dishes', value: dishes },
          { label: 'Dish views, all time', value: views.toLocaleString() },
          { label: 'Views, last 30 days', value: recent.toLocaleString() },
          { label: 'AR sessions', value: arViews.toLocaleString(), hint: views > 0 ? `${Math.round((arViews / views) * 100)}% of views` : undefined },
        ]}
      />

      <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
        <section className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-5 text-center">
          <QRCodeDisplay url={publicUrl} restaurantName={restaurant.name} />
          <p className="text-sm text-muted-foreground">Print this on tables, menus or the door.</p>
        </section>
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5">
          <h2 className="text-base font-semibold">Menu link</h2>
          <code className="break-all rounded-md bg-muted px-3 py-2 text-sm">{publicUrl}</code>
          <p className="text-sm text-muted-foreground">
            Diners land here when they scan the code. The page follows the name, colours and language you set in Settings.
          </p>
        </section>
      </div>
    </div>
  )
}
