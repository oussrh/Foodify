import { describe, expect, it } from 'vitest'
import { boardMetadata } from './order-board-page'

describe('boardMetadata', () => {
  it('points the manifest at this restaurant and this portal, so an installed tile opens the right board', () => {
    expect(boardMetadata('r-1', 'manager')).toEqual({ title: 'Orders', manifest: '/orders/manifest?id=r-1&portal=manager' })
    expect(boardMetadata('r-1', 'admin').manifest).toBe('/orders/manifest?id=r-1&portal=admin')
  })
})
