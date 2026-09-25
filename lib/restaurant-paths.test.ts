import { describe, expect, it } from 'vitest'
import { deviceLinks, isKitchenWord, kitchenBoardPath, kitchenMenuPath, portalBoardPath, restaurantPath, restaurantTab, waiterPath } from './restaurant-paths'

// The expected addresses are written out literally: they are what a tablet saved to its home
// screen and a manager bookmarked, so the test states them rather than rebuilding them.

describe('restaurant paths', () => {
  it('puts a portal tab under the restaurant code, the Info tab by default', () => {
    expect(restaurantPath('manager', 'K7M2QX')).toBe('/manager/restaurants/K7M2QX/info')
    expect(restaurantPath('admin', 'K7M2QX', 'dishes/create')).toBe('/admin/restaurants/K7M2QX/dishes/create')
    expect(restaurantPath('manager', 'K7M2QX', 'insights', 'grain=week')).toBe('/manager/restaurants/K7M2QX/insights?grain=week')
    expect(restaurantPath('admin', 'K7M2QX', 'dishes', '')).toBe('/admin/restaurants/K7M2QX/dishes')
    expect(restaurantPath('admin', 'K7M2QX', 'dishes/d-1/edit')).toBe('/admin/restaurants/K7M2QX/dishes/d-1/edit')
  })

  it('keeps the reader on their tab when switching restaurant, and falls back to Info', () => {
    expect(restaurantTab('insights')).toBe('insights')
    expect(restaurantTab('users')).toBe('users')
    expect(restaurantTab('create')).toBe('info')
    expect(restaurantTab(undefined)).toBe('info')
  })

  it('addresses a portal board by the code', () => {
    expect(portalBoardPath('admin', 'K7M2QX')).toBe('/admin/orders/K7M2QX')
    expect(portalBoardPath('manager', 'K7M2QX')).toBe('/manager/orders/K7M2QX')
  })

  it('puts the kitchen tablet restaurant first, then the screen, as the waiter app does', () => {
    expect(kitchenBoardPath('K7M2QX')).toBe('/kitchen/K7M2QX')
    expect(kitchenMenuPath('K7M2QX')).toBe('/kitchen/K7M2QX/menu')
  })

  it('keeps a uuid as given, so an address saved before codes existed stays the one it was', () => {
    const uuid = '54d3dcf7-5297-4b2e-99ac-ae4197735f29'
    expect(kitchenBoardPath(uuid)).toBe(`/kitchen/${uuid}`)
    expect(kitchenMenuPath(uuid)).toBe(`/kitchen/${uuid}/menu`)
  })

  it('addresses the waiter app by the code', () => {
    expect(waiterPath('K7M2QX')).toBe('/waiter/K7M2QX')
  })

  it("reserves the kitchen's own words, which are never a restaurant, in any case", () => {
    for (const word of ['orders', 'ORDERS', 'Menu', 'login']) expect(isKitchenWord(word)).toBe(true)
    // `orders` is six letters that fold onto a code, 0RDERS: reserved before it is ever looked up.
    for (const ref of ['K7M2QX', '0RDERS', '54d3dcf7-5297-4b2e-99ac-ae4197735f29']) expect(isKitchenWord(ref)).toBe(false)
  })

  it('makes the two device links absolute from the origin', () => {
    expect(deviceLinks('https://foodify.app', 'K7M2QX')).toEqual({
      kitchen: 'https://foodify.app/kitchen/K7M2QX',
      waiter: 'https://foodify.app/waiter/K7M2QX',
    })
  })
})
