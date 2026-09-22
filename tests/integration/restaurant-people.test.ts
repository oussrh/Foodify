import { describe, expect, it } from 'vitest'
import { addRestaurantManager, removeRestaurantManager, resetManagerPassword } from '@/app/actions/restaurant-manager-actions'
import { withRollback, type Tx } from './db'
import { kitchenTablet, manager, restaurant, superAdmin, waiter } from './fixtures'
import { signInAs } from './session'

// Who manages a restaurant, changed from that restaurant's own People tab. A manager is a peer of
// the other managers there, which is exactly why the limits matter: setting someone's password is
// taking their account, and an account can reach further than the restaurant you share with it.

const NEW_PASSWORD = 'set by a colleague'

const managersOf = (tx: Tx, id: string) =>
  tx.user.findMany({ where: { role: 'RESTAURANT_ADMIN', restaurants: { some: { id } } }, select: { id: true }, orderBy: { email: 'asc' } })

const hashOf = async (tx: Tx, id: string) => (await tx.user.findUniqueOrThrow({ where: { id }, select: { passwordHash: true } })).passwordHash

describe('a manager running their own restaurant', () => {
  it('adds a colleague who already has an account, keeping their password', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const elsewhere = await restaurant(tx)
      const colleague = await manager(tx, [elsewhere.id])
      const before = await hashOf(tx, colleague.id)
      signInAs(await manager(tx, [mine.id]))

      await addRestaurantManager(mine.id, { email: colleague.email, password: 'ignored here' })

      expect(await managersOf(tx, mine.id)).toHaveLength(2)
      expect(await hashOf(tx, colleague.id)).toBe(before)
      // The restaurant they already managed is untouched: this adds access, it does not move it.
      expect(await managersOf(tx, elsewhere.id)).toHaveLength(1)
    }))

  it('creates an account for an address that is new here', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))

      const added = await addRestaurantManager(mine.id, { email: 'new.hire@test.local', password: NEW_PASSWORD })

      const row = await tx.user.findUniqueOrThrow({ where: { id: added.id }, select: { role: true, restaurants: { select: { id: true } } } })
      expect(row.role).toBe('RESTAURANT_ADMIN')
      expect(row.restaurants).toEqual([{ id: mine.id }])
    }))

  it('refuses a new address with no password, rather than making an account nobody can open', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      signInAs(await manager(tx, [mine.id]))

      await expect(addRestaurantManager(mine.id, { email: 'no.password@test.local' })).rejects.toThrow()
      expect(await tx.user.findUnique({ where: { email: 'no.password@test.local' }, select: { id: true } })).toBeNull()
    }))

  it('refuses an address that belongs to an admin or a device: a role is never changed from here', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const admin = await superAdmin(tx)
      const tablet = await kitchenTablet(tx, [mine.id])
      signInAs(await manager(tx, [mine.id]))

      await expect(addRestaurantManager(mine.id, { email: admin.email })).rejects.toThrow()
      await expect(addRestaurantManager(mine.id, { email: tablet.email })).rejects.toThrow()
      expect(await managersOf(tx, mine.id)).toHaveLength(1)
    }))

  it('sets the password of a colleague who works here and nowhere else', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const colleague = await manager(tx, [mine.id])
      const before = await hashOf(tx, colleague.id)
      signInAs(await manager(tx, [mine.id]))

      await resetManagerPassword(mine.id, colleague.id, NEW_PASSWORD)

      expect(await hashOf(tx, colleague.id)).not.toBe(before)
    }))

  it('cannot set the password of a colleague who also runs another restaurant', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const elsewhere = await restaurant(tx)
      // The escalation this refuses: their account reaches a restaurant the caller was never let into.
      const colleague = await manager(tx, [mine.id, elsewhere.id])
      const before = await hashOf(tx, colleague.id)
      signInAs(await manager(tx, [mine.id]))

      await expect(resetManagerPassword(mine.id, colleague.id, NEW_PASSWORD)).rejects.toThrow()
      expect(await hashOf(tx, colleague.id)).toBe(before)
    }))

  it('lets a super admin set that password anyway', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const elsewhere = await restaurant(tx)
      const colleague = await manager(tx, [mine.id, elsewhere.id])
      const before = await hashOf(tx, colleague.id)
      signInAs(await superAdmin(tx))

      await resetManagerPassword(mine.id, colleague.id, NEW_PASSWORD)

      expect(await hashOf(tx, colleague.id)).not.toBe(before)
    }))

  it('cannot set its own password here, and cannot remove its own access', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const me = await manager(tx, [mine.id])
      signInAs(me)

      await expect(resetManagerPassword(mine.id, me.id, NEW_PASSWORD)).rejects.toThrow()
      await expect(removeRestaurantManager(mine.id, me.id)).rejects.toThrow()
      expect(await managersOf(tx, mine.id)).toHaveLength(1)
    }))

  it('removes a colleague from this restaurant only, leaving the account alone', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const elsewhere = await restaurant(tx)
      const colleague = await manager(tx, [mine.id, elsewhere.id])
      signInAs(await manager(tx, [mine.id]))

      await removeRestaurantManager(mine.id, colleague.id)

      expect(await managersOf(tx, mine.id)).toHaveLength(1)
      expect(await managersOf(tx, elsewhere.id)).toEqual([{ id: colleague.id }])
      expect(await tx.user.findUnique({ where: { id: colleague.id }, select: { id: true } })).not.toBeNull()
    }))

  it('reaches none of this from another restaurant', () =>
    withRollback(async (tx) => {
      const theirs = await restaurant(tx)
      const mine = await restaurant(tx)
      const theirManager = await manager(tx, [theirs.id])
      signInAs(await manager(tx, [mine.id]))

      await expect(addRestaurantManager(theirs.id, { email: 'intruder@test.local', password: NEW_PASSWORD })).rejects.toThrow()
      await expect(resetManagerPassword(theirs.id, theirManager.id, NEW_PASSWORD)).rejects.toThrow()
      await expect(removeRestaurantManager(theirs.id, theirManager.id)).rejects.toThrow()
      expect(await managersOf(tx, theirs.id)).toEqual([{ id: theirManager.id }])
    }))
})

describe('a device', () => {
  it('cannot change the people of the restaurant it is assigned to', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const colleague = await manager(tx, [mine.id])

      for (const device of [await kitchenTablet(tx, [mine.id]), await waiter(tx, [mine.id])]) {
        signInAs(device)
        await expect(addRestaurantManager(mine.id, { email: 'device@test.local', password: NEW_PASSWORD })).rejects.toThrow()
        await expect(resetManagerPassword(mine.id, colleague.id, NEW_PASSWORD)).rejects.toThrow()
        await expect(removeRestaurantManager(mine.id, colleague.id)).rejects.toThrow()
      }
      expect(await managersOf(tx, mine.id)).toEqual([{ id: colleague.id }])
    }))
})
