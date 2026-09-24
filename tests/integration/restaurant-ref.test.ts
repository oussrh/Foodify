import { describe, expect, it } from 'vitest'
import { restaurantIdFromParam } from '@/lib/restaurant-loader'
import { withRollback } from './db'
import { restaurant } from './fixtures'

// The segment of a kitchen or waiter link: the short code the links hand out, or the uuid a tablet
// saved before codes existed. Only a segment of neither shape is the page's 404; a well-formed code
// that matches nothing must reach the same sign-in redirect as a real one, or a signed-out stranger
// could learn which codes exist by the difference.

describe('restaurantIdFromParam', () => {
  it('is null for a segment that is neither a code nor a uuid', () =>
    withRollback(async () => {
      expect(await restaurantIdFromParam('not-a-restaurant')).toBeNull()
      expect(await restaurantIdFromParam('../admin')).toBeNull()
    }))

  it('finds a restaurant by its code, typed in any case', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      expect(await restaurantIdFromParam(mine.code)).toBe(mine.id)
      expect(await restaurantIdFromParam(mine.code.toLowerCase())).toBe(mine.id)
    }))

  it('returns a uuid as it is, leaving whether it exists to the guard', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      expect(await restaurantIdFromParam(mine.id)).toBe(mine.id)
    }))

  it('answers a code that matches nothing with something that is no restaurant, not with null', () =>
    withRollback(async (tx) => {
      const unknown = 'ZZZZZZ'
      expect(await tx.restaurant.findUnique({ where: { code: unknown } })).toBeNull()
      const id = await restaurantIdFromParam(unknown)
      expect(id).not.toBeNull()
      expect(await tx.restaurant.findFirst({ where: { id: id ?? '' } })).toBeNull()
    }))
})
