import { describe, expect, it } from 'vitest'
import type { Money } from './menu'
import { orderConfirmationText } from './order-message'

const order = { number: 12, table: '7', subtotal: '28.50' }
const euro: Money = { locale: 'en', symbol: '€', code: 'EUR' }

// Intl puts a non-breaking space between a currency and its amount ("MAD 28,50"); the message
// goes out with it, and the assertions read it as an ordinary space.
const plain = (s: string) => s.replace(/ /g, ' ')

describe('orderConfirmationText', () => {
  it('names the restaurant, the number, the table and the total, in the guest\'s language', () => {
    expect(plain(orderConfirmationText(order, 'Dar Zitoun', 'en', euro))).toBe('Dar Zitoun: order #12 received for table 7, total €28.50. Thank you!')
    expect(plain(orderConfirmationText(order, 'Dar Zitoun', 'fr', { ...euro, locale: 'fr' }))).toBe('Dar Zitoun : commande n° 12 reçue pour la table 7, total 28,50 €. Merci !')
  })

  it('formats the total in the restaurant\'s currency', () => {
    const dirham: Money = { locale: 'en', symbol: 'DH', code: 'MAD' }
    expect(plain(orderConfirmationText(order, 'Dar Zitoun', 'en', dirham))).toContain('MAD 28.50')
  })
})
