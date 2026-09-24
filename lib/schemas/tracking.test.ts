import { describe, expect, it } from 'vitest'
import { cartAdd, dishView } from './tracking'

const dishId = '4f0c6b7e-3d2a-4c8e-9b1f-2a3b4c5d6e01'

describe('the guest menu beacons', () => {
  it('fills a view in as a plain view on an unknown device', () => {
    expect(dishView.parse({ dishId })).toEqual({ dishId, arViewed: false, deviceType: 'Other' })
    expect(dishView.parse({ dishId, arViewed: true, deviceType: 'iOS' })).toEqual({ dishId, arViewed: true, deviceType: 'iOS' })
  })

  it('refuses a view of no dish, or from a device the table does not name', () => {
    expect(dishView.safeParse({ dishId: 'nope' }).success).toBe(false)
    expect(dishView.safeParse({ dishId, deviceType: 'Windows' }).success).toBe(false)
  })

  it('takes a cart add as a dish id and nothing else', () => {
    expect(cartAdd.parse({ dishId, restaurantId: 'x' })).toEqual({ dishId })
    expect(cartAdd.safeParse({}).success).toBe(false)
  })
})
