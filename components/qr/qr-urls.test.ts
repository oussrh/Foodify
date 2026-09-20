import { describe, expect, it } from 'vitest'
import { QR_SIZES, qrCodeUrl } from './qr-urls'

describe('qrCodeUrl', () => {
  it('encodes the menu URL into a square PNG of the size, in the design ink', () => {
    const url = 'https://foodify.app/restaurant/chez-oussama?lang=fr'
    expect(qrCodeUrl(url, QR_SIZES.card)).toBe(
      'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Ffoodify.app%2Frestaurant%2Fchez-oussama%3Flang%3Dfr&color=1b1a17&bgcolor=ffffff&qzone=2&format=png',
    )
    expect(qrCodeUrl(url, QR_SIZES.large)).toContain('?size=600x600&data=')
    expect(qrCodeUrl(url, QR_SIZES.download)).toContain('?size=1200x1200&data=')
  })
})
