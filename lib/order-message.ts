// lib/order-message.ts
// What the guest's confirmation says, in their language: the restaurant, the order's number,
// the table and what it comes to. One line, short enough for a single SMS segment with a
// restaurant name of normal length. Client-safe (no provider, no env).
import { formatPrice, type Locale, type Money } from '@/lib/menu'

/** The confirmation for one placed order, in `locale`; `money` formats the total the server computed. */
export function orderConfirmationText(
  order: { number: number; table: string; subtotal: string },
  restaurantName: string,
  locale: Locale,
  money: Money,
): string {
  const total = formatPrice(order.subtotal, money)
  return locale === 'fr'
    ? `${restaurantName} : commande n° ${order.number} reçue pour la table ${order.table}, total ${total}. Merci !`
    : `${restaurantName}: order #${order.number} received for table ${order.table}, total ${total}. Thank you!`
}
