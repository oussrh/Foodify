import { describe, expect, it } from 'vitest'
import { restaurantPageId } from '@/lib/restaurant-page'
import { restaurantPath } from '@/lib/restaurant-paths'
import { withRollback } from './db'
import { manager, restaurant, superAdmin } from './fixtures'
import { signInAs } from './session'

// A portal restaurant page's `[id]` segment: one address per page, the code. Any other spelling a
// reader may follow (the uuid of a bookmark made before codes, a code typed in lower case) is a
// permanent redirect to it; a segment of neither shape is the 404; a code that matches nothing is
// answered as an unknown uuid is, by the page's own lookup, never by a different response.

const dishes = (code: string) => restaurantPath('manager', code, 'dishes')
const permanentTo = (url: string) => expect.objectContaining({ digest: `NEXT_REDIRECT;replace;${url};308;` })
const notFound = expect.objectContaining({ digest: 'NEXT_HTTP_ERROR_FALLBACK;404' })

describe('restaurantPageId', () => {
  it('returns the uuid for the code as stored, with no redirect', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      expect(await restaurantPageId(mine.code, dishes)).toBe(mine.id)
    }))

  it('sends an old uuid address to the code, permanently', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))
      await expect(restaurantPageId(mine.id, dishes)).rejects.toEqual(permanentTo(`/manager/restaurants/${mine.code}/dishes`))
    }))

  it('sends a code typed in lower case to the code as stored', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await superAdmin(tx))
      const path = (code: string) => restaurantPath('admin', code, 'insights', 'grain=week')
      await expect(restaurantPageId(mine.code.toLowerCase(), path)).rejects.toEqual(permanentTo(`/admin/restaurants/${mine.code}/insights?grain=week`))
    }))

  it('tells a reader who may not open the restaurant nothing, not even its code', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const theirs = await restaurant(tx)
      signInAs(await manager(tx, [theirs.id]))
      expect(await restaurantPageId(mine.id, dishes)).toBe(mine.id)
      signInAs(null)
      expect(await restaurantPageId(mine.id, dishes)).toBe(mine.id)
    }))

  it('is the 404 for a segment that is neither a code nor a uuid', () =>
    withRollback(async (tx) => {
      signInAs(await superAdmin(tx))
      for (const bad of ['not-a-restaurant', 'K7M2Q', '../admin']) {
        await expect(restaurantPageId(bad, dishes)).rejects.toEqual(notFound)
      }
    }))

  it('answers a well-formed code that matches nothing the way it answers an unknown uuid', () =>
    withRollback(async (tx) => {
      signInAs(await superAdmin(tx))
      const unknownUuid = '00000000-0000-4000-8000-000000000000'
      const unknownCode = 'ZZZZZZ'
      expect(await tx.restaurant.findUnique({ where: { code: unknownCode } })).toBeNull()
      // Both come back as they were given, for the page's own lookup to find nothing.
      expect(await restaurantPageId(unknownUuid, dishes)).toBe(unknownUuid)
      expect(await restaurantPageId(unknownCode, dishes)).toBe(unknownCode)
      expect(await tx.restaurant.findFirst({ where: { id: unknownCode } })).toBeNull()
    }))
})
