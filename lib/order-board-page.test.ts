import { describe, expect, it } from 'vitest'
import { boardMetadata, staffAppMetadata } from './order-board-page'

const id = '4f0c6b7e-3d2a-4c8e-9b1f-2a3b4c5d6e01'

describe('boardMetadata', () => {
  it('points the manifest at this restaurant and this portal, so an installed tile opens the right board', () => {
    expect(boardMetadata(id, 'manager').manifest).toBe(`/orders/manifest?id=${id}&portal=manager`)
    expect(boardMetadata(id, 'admin').manifest).toBe(`/orders/manifest?id=${id}&portal=admin`)
  })

  it('installs the tablet as Foodizar Kitchen and a portal board as Foodizar Orders', () => {
    const kitchen = boardMetadata(id, 'kitchen')
    expect(kitchen.title).toBe('Foodizar Kitchen')
    expect(kitchen.appleWebApp).toMatchObject({ capable: true, title: 'Kitchen', statusBarStyle: 'default' })
    expect(kitchen.icons).toEqual({ apple: '/icons/staff/kitchen-apple-180.png' })
    expect(boardMetadata(id, 'manager')).toMatchObject({ title: 'Foodizar Orders', appleWebApp: { title: 'Orders' } })
  })
})

describe('staffAppMetadata', () => {
  it('names the restaurant by its code as stored, folding one typed by hand', () => {
    const meta = staffAppMetadata('k7m2qx', 'waiter')
    expect(meta).toMatchObject({
      title: 'Foodizar Waiter',
      appleWebApp: { capable: true, title: 'Waiter', statusBarStyle: 'default' },
      icons: { apple: '/icons/staff/waiter-apple-180.png' },
      formatDetection: { telephone: false },
      manifest: '/orders/manifest?id=K7M2QX&portal=waiter',
    })
  })

  it('links a Basil startup image per screen, each picked by its media query', () => {
    const images = staffAppMetadata('k7m2qx', 'waiter').appleWebApp
    const startup = typeof images === 'object' && images !== null ? images.startupImage : undefined
    expect(startup).toContainEqual({
      url: '/icons/staff/splash/waiter-1179x2556.png',
      media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    })
  })

  it('writes nothing from a segment that is neither a code nor a uuid into the address', () => {
    expect(staffAppMetadata('x&portal=admin', 'kitchen').manifest).toBeUndefined()
  })
})
