import { describe, expect, it } from 'vitest'
import { restaurantLinks } from './restaurant-links'

describe('restaurantLinks', () => {
  const restaurant = { code: 'K7M2QX', slug: 'le-jardin' }

  it('addresses the menu by slug and the devices by the short code', () => {
    expect(restaurantLinks('https://foodify.app', restaurant)).toEqual({
      menu: 'https://foodify.app/restaurant/le-jardin',
      tablet: 'https://foodify.app/kitchen/orders/K7M2QX',
      waiter: 'https://foodify.app/waiter/K7M2QX',
    })
  })

  it('gives a device an address short enough to type off a screen', () => {
    const links = restaurantLinks('https://foodify.app', restaurant)
    // The uuid it replaced was thirty-six characters on its own.
    expect(links.waiter.length).toBeLessThan('https://foodify.app/waiter/54d3dcf7-5297-4b2e-99ac-ae4197735f29'.length)
  })

  it('is absolute, because every one of these is read on another device', () => {
    for (const url of Object.values(restaurantLinks('http://localhost:3000', restaurant))) {
      expect(url.startsWith('http://localhost:3000/')).toBe(true)
    }
  })

  it('keeps the device links working across a rename, where the menu link follows the new slug', () => {
    const before = restaurantLinks('https://foodify.app', restaurant)
    const after = restaurantLinks('https://foodify.app', { ...restaurant, slug: 'le-jardin-2' })
    expect(after.tablet).toBe(before.tablet)
    expect(after.waiter).toBe(before.waiter)
    expect(after.menu).not.toBe(before.menu)
  })
})
