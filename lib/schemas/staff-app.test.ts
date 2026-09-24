import { describe, expect, it } from 'vitest'
import { restaurantRef, staffManifestQuery } from './staff-app'

const id = '54d3dcf7-5297-4b2e-99ac-ae4197735f29'

describe('restaurantRef', () => {
  it('takes a uuid as it is and a code as stored, folding one typed by hand', () => {
    expect(restaurantRef.parse(id)).toBe(id)
    expect(restaurantRef.parse('K7M2QX')).toBe('K7M2QX')
    expect(restaurantRef.parse(' k7m2qo ')).toBe('K7M2Q0')
  })

  it('refuses anything that is neither', () => {
    for (const bad of ['', 'K7M2Q', 'K7M2QX7', 'K7M2Q!', `${id}x`, '../admin']) {
      expect(restaurantRef.safeParse(bad).success).toBe(false)
    }
  })
})

describe('staffManifestQuery', () => {
  it('is a restaurant and one of the four staff apps', () => {
    expect(staffManifestQuery.parse({ id: 'k7m2qx', portal: 'waiter' })).toEqual({ id: 'K7M2QX', portal: 'waiter' })
    expect(staffManifestQuery.safeParse({ id, portal: 'guest' }).success).toBe(false)
    expect(staffManifestQuery.safeParse({ portal: 'kitchen' }).success).toBe(false)
  })
})
