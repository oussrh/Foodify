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
})
