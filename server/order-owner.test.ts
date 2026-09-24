import { afterEach, describe, expect, it, vi } from 'vitest'

const { orderFind, lineFind, changeFind, requireUser } = vi.hoisted(() => ({ orderFind: vi.fn(), lineFind: vi.fn(), changeFind: vi.fn(), requireUser: vi.fn(async () => ({ id: 'u1' })) }))
vi.mock('@/lib/prisma', () => ({ default: { order: { findUnique: orderFind }, orderLine: { findUnique: lineFind }, orderChange: { findUnique: changeFind } } }))
vi.mock('@/lib/auth-guard', () => ({
  requireUser,
  AuthError: class AuthError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message)
    }
  },
}))

import { changeRestaurant, lineOwner, orderRestaurant } from './order-owner'

// The restaurant an action guards is the row's own, and a row that is not there is refused the
// way another tenant's is: the same error, the same status, nothing to tell them apart.

describe('the owner of a row', () => {
  afterEach(() => vi.clearAllMocks())

  it('reads an order’s restaurant from the order', async () => {
    orderFind.mockResolvedValue({ restaurantId: 'r1' })
    await expect(orderRestaurant('o1')).resolves.toBe('r1')
  })

  it('reads a line’s ticket and restaurant from the line', async () => {
    lineFind.mockResolvedValue({ orderId: 'o1', order: { restaurantId: 'r1' } })
    await expect(lineOwner('l1')).resolves.toEqual({ orderId: 'o1', restaurantId: 'r1' })
  })

  it('reads a request’s restaurant from the request', async () => {
    changeFind.mockResolvedValue({ restaurantId: 'r2' })
    await expect(changeRestaurant('c1')).resolves.toBe('r2')
  })

  it('refuses a missing order, line or request with a 403, as it would another tenant’s', async () => {
    orderFind.mockResolvedValue(null)
    lineFind.mockResolvedValue(null)
    changeFind.mockResolvedValue(null)
    await expect(orderRestaurant('o1')).rejects.toMatchObject({ message: 'Forbidden', status: 403 })
    await expect(lineOwner('l1')).rejects.toMatchObject({ message: 'Forbidden', status: 403 })
    await expect(changeRestaurant('c1')).rejects.toMatchObject({ message: 'Forbidden', status: 403 })
  })

  it('refuses anyone not signed in before any row is read', async () => {
    requireUser.mockRejectedValueOnce(Object.assign(new Error('Not authenticated'), { status: 401 }))
    await expect(orderRestaurant('o1')).rejects.toMatchObject({ status: 401 })
    expect(orderFind).not.toHaveBeenCalled()
  })
})
