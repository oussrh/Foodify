// components/menu/tracking/tracking-page.tsx
// The page a guest's tracking link opens (/restaurant/<slug>/order/<secret>): the tracker in the
// restaurant's brand and theme, with the way back to the menu. A page rather than a sheet so it
// survives a reload and can be kept on the home screen; the status itself is always asked for
// from the phone, so no copy of this page, cached or rendered, ever shows a stale one.
'use client'

import type { MenuRestaurant } from '@/lib/menu'
import MenuSubPage, { type SubPageRestaurant } from '../menu-sub-page'
import OrderTracker from './order-tracker'

interface TrackingPageProps {
  token: string
  restaurant: SubPageRestaurant & Pick<MenuRestaurant, 'id' | 'currencySymbol' | 'currency'>
  brandStyle: Record<string, string>
  urlLang?: string | null | undefined
}

/** The guest's order page: the menu's top bar, then the order followed live. */
export default function TrackingPage({ token, restaurant, brandStyle, urlLang }: TrackingPageProps) {
  return (
    <MenuSubPage restaurant={restaurant} brandStyle={brandStyle} urlLang={urlLang}>
      {(locale) => <OrderTracker token={token} restaurant={restaurant} locale={locale} />}
    </MenuSubPage>
  )
}
