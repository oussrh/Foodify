import { describe, expect, it } from 'vitest'
import { orderAction, orderBoardQuery } from './order-board'

const id = '11111111-1111-4111-8111-111111111111'

describe('orderBoardQuery', () => {
  it('takes a restaurant, with the statuses optional', () => {
    expect(orderBoardQuery.parse({ restaurantId: id })).toEqual({ restaurantId: id })
    expect(orderBoardQuery.parse({ restaurantId: id, status: ['NEW', 'DONE'] }).status).toEqual(['NEW', 'DONE'])
  })

  it('refuses an id that is not a uuid, an unknown status and an empty list', () => {
    expect(orderBoardQuery.safeParse({ restaurantId: 'r1' }).success).toBe(false)
    expect(orderBoardQuery.safeParse({ restaurantId: id, status: ['COOKING'] }).success).toBe(false)
    expect(orderBoardQuery.safeParse({ restaurantId: id, status: [] }).success).toBe(false)
  })
})

describe('orderAction', () => {
  it('takes the three the board offers', () => {
    for (const action of ['accept', 'done', 'cancel'] as const) {
      expect(orderAction.parse({ orderId: id, action }).action).toBe(action)
    }
  })

  it('refuses anything else, and an id that is not a uuid', () => {
    expect(orderAction.safeParse({ orderId: id, action: 'delete' }).success).toBe(false)
    expect(orderAction.safeParse({ orderId: 'o1', action: 'done' }).success).toBe(false)
  })
})
