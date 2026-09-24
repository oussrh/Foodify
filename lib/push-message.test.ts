import { describe, expect, it } from 'vitest'
import { changeAnswerPush, changeRequestPush, newOrderPush, orderReadyPush, requestWords } from './push-message'

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

describe('the floor’s requests and the kitchen’s answers', () => {
  const removal = { changeId: 'c-1', orderNumber: 12, table: '4', dish: 'Tea', quantity: 1 }
  const cancel = { changeId: 'c-2', orderNumber: 12, table: '4', dish: null, quantity: null }

  it('says what is asked in the card’s own words', () => {
    expect(requestWords(removal)).toBe('remove 1 Tea')
    expect(requestWords(cancel)).toBe('cancel order #12')
  })

  it('wakes the tablet board with the table and the request, and nothing about the guest', () => {
    expect(changeRequestPush(removal, restaurant)).toEqual({
      title: 'Table 4 asks to remove 1 Tea',
      body: 'Accept or refuse it on the board',
      tag: 'request-c-1',
      url: '/kitchen/orders/K7M2QX',
      kind: 'request',
      restaurantId: 'r-1',
    })
  })

  it('tells the waiter who asked what the kitchen answered, and opens their floor', () => {
    expect(changeAnswerPush(cancel, false, restaurant)).toEqual({
      title: 'Kitchen refused: cancel order #12',
      body: 'Table 4 · order #12',
      tag: 'answer-c-2',
      url: '/waiter/K7M2QX',
      kind: 'answer',
      restaurantId: 'r-1',
    })
    expect(changeAnswerPush(removal, true, restaurant).title).toBe('Kitchen accepted: remove 1 Tea')
  })
})
