import type { MenuCategory, MenuDish, MenuRestaurant } from '@/lib/menu'

/** The dish's own page: the href of its row and the target of its share link. */
export const dishHref = (slug: string, dish: MenuDish) => `/restaurant/${slug}/dish/${dish.id}`

/** Everything the service worker should keep so this menu opens with no signal. */
export function precacheUrls(restaurant: MenuRestaurant, categories: MenuCategory[], uncategorizedDishes: MenuDish[]): string[] {
  const img = (src: string, w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`
  const urls = [`/restaurant/${restaurant.slug}`, `/restaurant/${restaurant.slug}/manifest`]
  if (restaurant.logoUrl) urls.push(img(restaurant.logoUrl, 256))
  if (restaurant.coverImageUrl) urls.push(restaurant.coverImageUrl)
  const dishes = [...categories.flatMap((c) => c.subcategories.flatMap((s) => s.dishes)), ...uncategorizedDishes]
  for (const d of dishes) if (d.imageUrl) urls.push(img(d.imageUrl, 640))
  return urls
}
