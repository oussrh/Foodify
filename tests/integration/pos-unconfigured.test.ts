import { afterAll, describe, expect, it, vi } from 'vitest'
import { connectPos } from '@/app/actions/pos-connect-actions'
import { GET as cron } from '@/app/api/pos/outbox/route'
import { loadPosView } from '@/server/pos/view'
import { withRollback } from './db'
import { floor } from './bill-fixtures'
import { signInAs } from './session'

// A server with neither POS_ENCRYPTION_KEY nor CRON_SECRET: connecting a POS is refused with a
// message saying why (nothing is stored in the clear), and the cron's route is shut to everyone.

vi.stubEnv('POS_ENCRYPTION_KEY', '')
vi.stubEnv('CRON_SECRET', '')
afterAll(() => vi.unstubAllEnvs())

describe('a server without the POS keys', () => {
  it('refuses to connect a POS, saying it is not configured, and stores nothing', () =>
    withRollback(async (tx) => {
      const { place, manager } = await floor(tx)
      signInAs(manager)
      expect(await connectPos(place.id, { provider: 'test-pos', apiKey: 'test_demo_key' })).toEqual({ ok: false, error: 'POS integration is not configured on this server' })
      expect(await tx.posConnection.count({ where: { restaurantId: place.id } })).toBe(0)
      expect((await loadPosView(place.id)).configured).toBe(false)
    }))

  it('refuses every cron call, whatever bearer it carries', async () => {
    expect((await cron(new Request('http://test/api/pos/outbox', { headers: { authorization: 'Bearer anything-at-all-here' } }))).status).toBe(401)
  })
})
