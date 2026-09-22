import { describe, expect, it } from 'vitest'
import { restaurantLinks } from './restaurant-links'

describe('restaurantLinks', () => {
  const restaurant = { id: '8f0f3d6a-1d3f-4a1b-9c2e-000000000001', slug: 'le-jardin' }

  it('addresses the menu by slug and the devices by id', () => {
    expect(restaurantLinks('https://foodify.app', restaurant)).toEqual({
      menu: 'https://foodify.app/restaurant/le-jardin',
      tablet: `https://foodify.app/kitchen/orders/${restaurant.id}`,
      waiter: `https://foodify.app/waiter/${restaurant.id}`,
    })
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
