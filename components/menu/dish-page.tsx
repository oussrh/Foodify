"use client"

import { type MenuDish, type MenuRestaurant } from '@/lib/menu'
import MenuSubPage from './menu-sub-page'
import { useCart } from './cart/use-cart'
import DishBody from './dish-body'
import { useDishView } from './use-dish-view'

interface DishPageProps {
  dish: MenuDish
  restaurant: Pick<MenuRestaurant, 'id' | 'name' | 'slug' | 'defaultLocale' | 'fontFamily' | 'currencySymbol' | 'currency' | 'menuTheme' | 'orderingEnabled'>
  breadcrumb: { en: string; fr: string } | null
  brandStyle: Record<string, string>
  shareUrl: string
  urlLang?: string | null
}

/** Full-page version of the dish sheet, for shared links and QR codes that point at one dish. */
export default function DishPage({ dish, restaurant, breadcrumb, brandStyle, shareUrl, urlLang }: DishPageProps) {
  useDishView(dish.id)
  // The same cart as the menu's, so a dish added from a shared link is in the order there too.
  const cart = useCart(restaurant.id)

  return (
    <MenuSubPage restaurant={restaurant} brandStyle={brandStyle} urlLang={urlLang}>
      {(locale) => (
        <DishBody
          headingLevel="h1"
          dish={dish}
          locale={locale}
          money={{ locale, symbol: restaurant.currencySymbol, code: restaurant.currency }}
          breadcrumb={breadcrumb ? (locale === 'fr' ? breadcrumb.fr : breadcrumb.en) : null}
          shareUrl={shareUrl}
          order={
            // Sold out for the rest of the service: nothing to add, here or at the endpoint.
            restaurant.orderingEnabled && !dish.soldOut
              ? {
                  quantity: cart.quantityOf(dish.id),
                  onChange: (quantity) => cart.setQuantity(dish.id, quantity),
                  note: cart.noteOf(dish.id),
                  onNote: (note) => cart.setNote(dish.id, note),
                }
              : undefined
          }
        />
      )}
    </MenuSubPage>
  )
}
