import { describe, expect, it } from 'vitest'
import { boardMetadata, staffAppMetadata } from './order-board-page'

const id = '4f0c6b7e-3d2a-4c8e-9b1f-2a3b4c5d6e01'

/** What every staff page tells an iPhone or iPad, spelled out here rather than read from the code. */
const apple = (title: string) => ({
  appleWebApp: { capable: true, title, statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
  formatDetection: { telephone: false },
})

describe('boardMetadata', () => {
  it('points the manifest at this restaurant and this portal, so an installed tile opens the right board', () => {
    expect(boardMetadata(id, 'manager')).toEqual({ title: 'Orders', ...apple('Orders'), manifest: `/orders/manifest?id=${id}&portal=manager` })
    expect(boardMetadata(id, 'admin').manifest).toBe(`/orders/manifest?id=${id}&portal=admin`)
  })
})

describe('staffAppMetadata', () => {
  it('names the restaurant by its code as stored, folding one typed by hand', () => {
    expect(staffAppMetadata('k7m2qx', 'waiter', 'Service')).toEqual({ title: 'Service', ...apple('Service'), manifest: '/orders/manifest?id=K7M2QX&portal=waiter' })
  })

  it('writes nothing from a segment that is neither a code nor a uuid into the address', () => {
    expect(staffAppMetadata('x&portal=admin', 'kitchen', 'Orders')).toEqual({ title: 'Orders', ...apple('Orders') })
  })
})
