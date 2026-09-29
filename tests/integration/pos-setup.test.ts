import { describe, expect, it } from 'vitest'
import { TEST_POS_KEY, connection, outbox, place, posFloor } from './pos-fixtures'
import { choosePosLocation, connectPos, listPosLocations, testPos } from '@/app/actions/pos-connect-actions'
import { disconnectPos, pausePos, resumePos, retryPosNow } from '@/app/actions/pos-control-actions'
import { activatePos, readPosMenu, savePosMapping } from '@/app/actions/pos-mapping-actions'
import { loadPosView } from '@/server/pos/view'
import { withRollback } from './db'
import { manager, restaurant, superAdmin } from './fixtures'
import { signInAs } from './session'

// Connecting a restaurant's POS from Settings → Integrations, on the real database: its owner
// signs in to the Test POS, tests it, chooses a location, matches the dishes and activates it,
// with nothing switched on for the restaurant first; a super admin may take every one of those
// steps for the owner; another restaurant's owner is refused at every step. The key under test is
// the suite's own (pos-fixtures.ts).

describe('a restaurant as it was created', () => {
  it('lets its owner connect a POS, with nothing switched on first', () =>
    withRollback(async (tx) => {
      const { place, manager: owner } = await posFloor(tx)
      signInAs(owner)
      expect(await loadPosView(place.id)).toMatchObject({ configured: true, connection: null })
      expect(await connectPos(place.id, { provider: 'test-pos', apiKey: 'test_demo_key' })).toMatchObject({ ok: true })
      expect(await tx.posConnection.findUniqueOrThrow({ where: { restaurantId: place.id } })).toMatchObject({ status: 'CONNECTING' })
    }))

  it('refuses to connect for nobody signed in', () =>
    withRollback(async (tx) => {
      const { place } = await posFloor(tx)
      signInAs(null)
      await expect(connectPos(place.id, { provider: 'test-pos', apiKey: 'test_demo_key' })).rejects.toMatchObject({ status: 401 })
      expect(await tx.posConnection.count({ where: { restaurantId: place.id } })).toBe(0)
    }))
})

describe('an owner connecting the Test POS', () => {
  it('connects, tests, chooses a location, matches the dishes and activates', () =>
    withRollback(async (tx) => {
      const { place, manager: owner, harira } = await posFloor(tx)
      signInAs(owner)

      expect((await loadPosView(place.id)).providers.map((provider) => provider.key)).toContain('test-pos')
      const connected = await connectPos(place.id, { provider: 'test-pos', apiKey: 'test_demo_key' })
      expect(connected).toMatchObject({ ok: true, locations: [{ id: 'tpos-dining-room' }, { id: 'tpos-terrace' }] })
      const stored = await tx.posConnection.findUniqueOrThrow({ where: { restaurantId: place.id } })
      expect(stored).toMatchObject({ provider: 'test-pos', status: 'CONNECTING', credentialsKeyId: 'k1' })
      // Sealed: the key is nowhere in the row.
      expect(JSON.stringify(stored)).not.toContain('test_demo_key')
      expect(JSON.stringify(stored)).not.toContain(TEST_POS_KEY)

      expect(await testPos(place.id)).toEqual({ ok: true, message: 'The Test POS answered' })
      expect(await listPosLocations(place.id)).toMatchObject({ ok: true, locations: [{ name: 'Dining room' }, { name: 'Terrace' }] })
      expect(await choosePosLocation(place.id, { locationId: 'somewhere-else' })).toEqual({ ok: false, error: 'That location is not one this POS lists' })
      expect(await choosePosLocation(place.id, { locationId: 'tpos-terrace' })).toEqual({ ok: true, locationId: 'tpos-terrace' })

      const menu = await readPosMenu(place.id)
      expect(menu.ok && menu.rows).toEqual([{ dishId: harira.id, name: 'Harira', price: '9.50', suggestedItemId: 'tpos-item-harira', currentItemId: null }])
      expect(await savePosMapping(place.id, { items: [{ dishId: harira.id, externalItemId: 'tpos-item-harira' }] })).toEqual({ ok: true, mapped: 1 })
      const map = await tx.posItemMap.findFirstOrThrow({ where: { dishId: harira.id } })
      expect(map.externalPrice.toFixed(2)).toBe('4.50')

      expect(await activatePos(place.id)).toEqual({ ok: true, status: 'ACTIVE', discarded: 0 })
      expect((await loadPosView(place.id)).connection).toMatchObject({ status: 'ACTIVE', locationId: 'tpos-terrace', locationName: 'Terrace', dishes: 1, mapped: 1, counts: { pending: 0, sent: 0, failed: 0, refused: 0, discarded: 0 } })
    }))

  it('keeps nothing when the POS refuses the key, and refuses a provider that is coming soon', () =>
    withRollback(async (tx) => {
      const { place, manager: owner } = await posFloor(tx)
      signInAs(owner)
      expect(await connectPos(place.id, { provider: 'test-pos', apiKey: 'live_1234567' })).toEqual({ ok: false, error: 'The Test POS takes a key that starts with test_' })
      expect(await connectPos(place.id, { provider: 'square', apiKey: 'sq0atp-123456' })).toEqual({ ok: false, error: 'Square is coming soon' })
      expect(await tx.posConnection.count({ where: { restaurantId: place.id } })).toBe(0)
    }))

  it('refuses a dish of another restaurant in the matches', () =>
    withRollback(async (tx) => {
      const { place, manager: owner } = await posFloor(tx)
      const theirs = await posFloor(tx)
      await connection(tx, place.id, { status: 'MAPPING' })
      signInAs(owner)
      expect(await savePosMapping(place.id, { items: [{ dishId: theirs.harira.id, externalItemId: 'tpos-item-harira' }] })).toEqual({ ok: false, error: 'A dish is not on this menu' })
      expect(await tx.posItemMap.count()).toBe(0)
    }))

  it('pauses, resumes and disconnects, and a super admin may do it for the owner', () =>
    withRollback(async (tx) => {
      const { place } = await posFloor(tx)
      await connection(tx, place.id)
      signInAs(await superAdmin(tx))

      expect(await pausePos(place.id)).toEqual({ ok: true, status: 'PAUSED', discarded: 0 })
      expect(await pausePos(place.id)).toEqual({ ok: false, error: 'Not while the connection is “Paused”' })
      expect(await resumePos(place.id, { waiting: 'send' })).toEqual({ ok: true, status: 'ACTIVE', discarded: 0 })
      expect(await disconnectPos(place.id)).toEqual({ ok: true })
      expect(await tx.posConnection.findUniqueOrThrow({ where: { restaurantId: place.id } })).toMatchObject({ status: 'NOT_CONNECTED', credentials: null, externalLocationId: null })
      expect((await loadPosView(place.id)).connection).toBeNull()
    }))

  it('says in plain words why a test failed, and keeps it as the last error', () =>
    withRollback(async (tx) => {
      const { place, manager: owner } = await posFloor(tx)
      const made = await connection(tx, place.id)
      await tx.posConnection.update({ where: { id: made.id }, data: { credentials: 'v1.broken.value.x' } })
      signInAs(owner)
      const why = 'These credentials are not in a form this server reads'
      expect(await testPos(place.id)).toEqual({ ok: false, error: why })
      expect(await tx.posConnection.findUniqueOrThrow({ where: { id: made.id } })).toMatchObject({ lastError: why, status: 'ACTIVE' })
    }))
})

describe('a super admin acting for the owner', () => {
  it('takes every step the owner takes, on a restaurant they are not assigned to', () =>
    withRollback(async (tx) => {
      const { place, harira } = await posFloor(tx)
      signInAs(await superAdmin(tx))

      expect(await connectPos(place.id, { provider: 'test-pos', apiKey: 'test_demo_key' })).toMatchObject({ ok: true })
      expect(await testPos(place.id)).toEqual({ ok: true, message: 'The Test POS answered' })
      expect(await listPosLocations(place.id)).toMatchObject({ ok: true })
      expect(await choosePosLocation(place.id, { locationId: 'tpos-dining-room' })).toEqual({ ok: true, locationId: 'tpos-dining-room' })
      expect(await readPosMenu(place.id)).toMatchObject({ ok: true })
      expect(await savePosMapping(place.id, { items: [{ dishId: harira.id, externalItemId: 'tpos-item-harira' }] })).toEqual({ ok: true, mapped: 1 })
      expect(await activatePos(place.id)).toMatchObject({ ok: true, status: 'ACTIVE' })
      expect(await pausePos(place.id)).toMatchObject({ ok: true, status: 'PAUSED' })
      expect(await resumePos(place.id, { waiting: 'discard' })).toMatchObject({ ok: true, status: 'ACTIVE' })
      expect(await retryPosNow(place.id)).toMatchObject({ ok: true })
      expect(await disconnectPos(place.id)).toEqual({ ok: true })
    }))
})

describe('what the POS will never be sent', () => {
  it('is discarded, with the item matches, when the owner signs in to another account', () =>
    withRollback(async (tx) => {
      const { place: restaurant, manager: owner, harira } = await posFloor(tx)
      const made = await connection(tx, restaurant.id, { status: 'ERROR' })
      await tx.posItemMap.create({ data: { connectionId: made.id, dishId: harira.id, externalItemId: 'tpos-item-harira', externalPrice: '4.50' } })
      await place({ restaurantId: restaurant.id, table: '4', phone: '+212600112233', lines: [{ dishId: harira.id, quantity: 1 }] })
      signInAs(owner)
      expect(await connectPos(restaurant.id, { provider: 'test-pos', apiKey: 'test_another_account' })).toMatchObject({ ok: true })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'DISCARDED' }])
      expect(await tx.posItemMap.count({ where: { connectionId: made.id } })).toBe(0)
      expect(await tx.posConnection.findUniqueOrThrow({ where: { id: made.id } })).toMatchObject({ status: 'CONNECTING', externalLocationId: null })
    }))

  it('is kept, with the matches and the location, when the owner signs in to the same account again', () =>
    withRollback(async (tx) => {
      const { place: restaurant, manager: owner, harira } = await posFloor(tx)
      signInAs(owner)
      await connectPos(restaurant.id, { provider: 'test-pos', apiKey: 'test_same_account' })
      await choosePosLocation(restaurant.id, { locationId: 'tpos-dining-room' })
      await savePosMapping(restaurant.id, { items: [{ dishId: harira.id, externalItemId: 'tpos-item-harira' }] })
      await tx.posConnection.update({ where: { restaurantId: restaurant.id }, data: { status: 'ERROR' } })
      await place({ restaurantId: restaurant.id, table: '4', phone: '+212600112233', lines: [{ dishId: harira.id, quantity: 1 }] })
      await connectPos(restaurant.id, { provider: 'test-pos', apiKey: 'test_same_account' })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'PENDING' }])
      expect(await tx.posItemMap.count()).toBe(1)
      // Another location than before: what waited for the old one is discarded with the matches.
      expect(await choosePosLocation(restaurant.id, { locationId: 'tpos-terrace' })).toMatchObject({ ok: true })
      expect(await outbox(tx, restaurant.id)).toMatchObject([{ status: 'DISCARDED' }])
      expect(await tx.posItemMap.count()).toBe(0)
    }))
})

describe('another restaurant’s owner', () => {
  it('is refused at every POS action, the same way whatever the state', () =>
    withRollback(async (tx) => {
      const { place } = await posFloor(tx)
      await connection(tx, place.id, { status: 'MAPPING' })
      const elsewhere = await restaurant(tx)
      signInAs(await manager(tx, [elsewhere.id]))

      const attempts: (() => Promise<unknown>)[] = [
        () => listPosLocations(place.id),
        () => connectPos(place.id, { provider: 'test-pos', apiKey: 'test_demo_key' }),
        () => testPos(place.id),
        () => choosePosLocation(place.id, { locationId: 'tpos-terrace' }),
        () => readPosMenu(place.id),
        () => savePosMapping(place.id, { items: [] }),
        () => activatePos(place.id),
        () => pausePos(place.id),
        () => resumePos(place.id, { waiting: 'send' }),
        () => disconnectPos(place.id),
        () => retryPosNow(place.id),
      ]
      for (const attempt of attempts) await expect(attempt()).rejects.toMatchObject({ status: 403 })
      expect(await tx.posConnection.findUniqueOrThrow({ where: { restaurantId: place.id } })).toMatchObject({ status: 'MAPPING', externalLocationId: 'tpos-dining-room' })
    }))
})
