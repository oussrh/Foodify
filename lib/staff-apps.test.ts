import { describe, expect, it } from 'vitest'
import { STAFF_APP_IDENTITY, STAFF_BRAND, staffAppName, staffBrandApp, staffIconPath, startupImages } from './staff-apps'

describe('the staff apps as installed', () => {
  it('are Foodizar, on Basil with white', () => {
    expect(STAFF_BRAND).toEqual({ name: 'Foodizar', color: '#1F6B49', ink: '#FFFFFF' })
    expect(STAFF_APP_IDENTITY.waiter).toMatchObject({ name: 'Foodizar Waiter', shortName: 'Waiter', subtitle: 'Waiter App' })
    expect(STAFF_APP_IDENTITY.kitchen).toMatchObject({ name: 'Foodizar Kitchen', shortName: 'Kitchen', subtitle: 'Kitchen App' })
    expect(STAFF_APP_IDENTITY.orders).toMatchObject({ name: 'Foodizar Orders', shortName: 'Orders' })
  })

  it("install both portals' boards as the one Orders app", () => {
    expect(staffBrandApp('admin')).toBe('orders')
    expect(staffBrandApp('manager')).toBe('orders')
    expect(staffBrandApp('kitchen')).toBe('kitchen')
    expect(staffBrandApp('waiter')).toBe('waiter')
  })

  it('carry the restaurant in the full name, and only when there is one', () => {
    expect(staffAppName('kitchen', 'Chez Nous')).toBe('Foodizar Kitchen · Chez Nous')
    expect(staffAppName('kitchen', null)).toBe('Foodizar Kitchen')
  })

  it('describe each app for one restaurant, and without one', () => {
    for (const identity of Object.values(STAFF_APP_IDENTITY)) {
      expect(identity.about('Chez Nous')).toContain('Chez Nous')
      expect(identity.generic).not.toContain('Chez Nous')
    }
  })

  it('name one icon file per app and size', () => {
    expect(staffIconPath('waiter', 'maskable-512')).toBe('/icons/staff/waiter-maskable-512.png')
  })
})

describe('startupImages', () => {
  it('draws a phone app upright only, one image per iPhone screen', () => {
    const images = startupImages('waiter')
    expect(images).toHaveLength(6)
    expect(images.every((image) => image.media.endsWith('(orientation: portrait)') && image.height > image.width)).toBe(true)
    expect(images).toContainEqual({
      url: '/icons/staff/splash/waiter-750x1334.png',
      media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
      width: 750,
      height: 1334,
    })
  })

  it('draws a tablet app both ways up, with the portrait device size in both queries', () => {
    const images = startupImages('kitchen')
    expect(images).toHaveLength(8)
    expect(images).toContainEqual({
      url: '/icons/staff/splash/kitchen-2732x2048.png',
      media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)',
      width: 2732,
      height: 2048,
    })
  })
})
