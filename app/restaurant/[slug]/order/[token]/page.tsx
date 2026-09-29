import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import TrackingPage from '@/components/menu/tracking/tracking-page'
import { brandStyle } from '@/lib/brand-color'
import { serializeRestaurant } from '@/lib/menu-data'
import { menuOrderSegments, menuQuery, routeParams, type SearchParams } from '@/lib/schemas/page-params'

type Props = { params: Promise<{ slug: string; token: string }>; searchParams?: Promise<SearchParams> }

// The address carries a secret: kept out of search engines, and out of the Referer sent onward.
export const metadata: Metadata = {
  title: 'Your order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

/**
 * A guest's order, followed from their phone: the restaurant's brand read here, the order itself
 * asked for by the page (GET /api/orders/track/<token>), so nothing about it is rendered, cached
 * or indexed with the page. A malformed secret is the route's 404; an unknown one is said so on
 * the page, since only the endpoint can tell.
 */
export default async function OrderTrackingRoute({ params, searchParams }: Props) {
  const { slug, token } = routeParams(menuOrderSegments, await params)
  const { lang } = menuQuery.parse((await searchParams) ?? {})
  const row = await prisma.restaurant.findUnique({ where: { slug } })
  if (!row) notFound()
  const restaurant = serializeRestaurant(row)

  return (
    <>
      {restaurant.googleFontUrl && <link href={restaurant.googleFontUrl} rel="stylesheet" />}
      <TrackingPage token={token} restaurant={restaurant} brandStyle={brandStyle(restaurant.colorTheme)} urlLang={lang ?? null} />
    </>
  )
}
