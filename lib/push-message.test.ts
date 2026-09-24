import { describe, expect, it } from 'vitest'
import { newOrderPush, orderReadyPush } from './push-message'

const order = { id: 'o-1', number: 12, table: '4', dishes: 3 }
const restaurant = { id: 'r-1', code: 'K7M2QX' }

describe('newOrderPush', () => {
  it('names the order, the table and the plates, and opens the tablet board by the short code', () => {
    expect(newOrderPush(order, restaurant)).toEqual({
      title: 'New order #12',
      body: 'Table 4 · 3 dishes',
      tag: 'order-o-1',
      url: '/kitchen/orders/K7M2QX',
      kind: 'order',
      restaurantId: 'r-1',
    })
  })

  it('says one dish, not one dishes', () => {
    expect(newOrderPush({ ...order, dishes: 1 }, restaurant).body).toBe('Table 4 · 1 dish')
  })

  it('titles an addition by the bill it belongs to, not by its own number', () => {
    const addition = newOrderPush({ ...order, number: 15, dishes: 2, parentNumber: 12 }, restaurant)
    expect(addition).toMatchObject({ title: 'Addition to #12', body: 'Table 4 · 2 dishes', tag: 'order-o-1' })
    expect(newOrderPush({ ...order, parentNumber: null }, restaurant).title).toBe('New order #12')
  })
})

describe('orderReadyPush', () => {
  it('leads with the table, which is what the waiter walks to', () => {
    expect(orderReadyPush(order, restaurant)).toEqual({
      title: 'Table 4 is ready',
      body: 'Order #12 · 3 dishes',
      tag: 'ready-o-1',
      url: '/waiter/K7M2QX',
      kind: 'ready',
      restaurantId: 'r-1',
    })
  })
})
