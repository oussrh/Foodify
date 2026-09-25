import { describe, expect, it } from 'vitest'
import { GET as manifestOf } from '@/app/orders/manifest/route'
import { withRollback } from './db'
import { restaurant } from './fixtures'

// The manifest a staff app installs from: what the device's home screen and window chrome read.
const get = (query: string) => manifestOf(new Request(`http://test/orders/manifest?${query}`))

describe('the staff app manifest', () => {
  it('asks for full screen first, so an installed app on Android hides the system bars', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const res = await get(`id=${mine.code}&portal=waiter`)
      expect(res.status).toBe(200)
      const manifest = await res.json()
      expect(manifest.display_override).toEqual(['fullscreen', 'standalone', 'minimal-ui'])
      expect(manifest.display).toBe('standalone')
      expect(manifest.start_url).toBe(`/waiter/${mine.code}`)
    }))

  it('is installable from the short code as well as the id', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      expect((await get(`id=${mine.code}&portal=kitchen`)).status).toBe(200)
      expect((await get(`id=${mine.id}&portal=kitchen`)).status).toBe(200)
      expect((await get(`id=not-a-restaurant&portal=kitchen`)).status).toBe(400)
    }))

  it('opens the tablet on its new board address and keeps the identity it was installed under', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      for (const ref of [mine.code, mine.id]) {
        const manifest = await (await get(`id=${ref}&portal=kitchen`)).json()
        // A changed id would make an installed tablet a different app that never updates.
        expect(manifest.id).toBe(`/kitchen/orders/${ref}`)
        expect(manifest.start_url).toBe(`/kitchen/${ref}`)
        expect(manifest.scope).toBe(`/kitchen/${ref}`)
      }
    }))

  it('answers a well-shaped reference to no restaurant like a real one, minus the name', () =>
    withRollback(async (tx) => {
      const mine = await restaurant(tx)
      const real = await get(`id=${mine.code}&portal=kitchen`)
      for (const ref of ['ZZZZZZ', '00000000-0000-4000-8000-000000000000']) {
        const res = await get(`id=${ref}&portal=kitchen`)
        expect(res.status).toBe(real.status)
        expect(res.headers.get('Cache-Control')).toBe(real.headers.get('Cache-Control'))
        const manifest = await res.json()
        expect(manifest).toMatchObject({ name: 'Orders', short_name: 'Orders', start_url: `/kitchen/${ref}` })
        expect(JSON.stringify(manifest)).not.toContain(mine.name)
      }
      expect((await get('id=ZZZZZZ&portal=nope')).status).toBe(400)
    }))
})
