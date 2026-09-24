import { describe, expect, it } from 'vitest'
import { adapterFor, providerOf, providerSummaries } from './registry'

const context = { credentials: { apiKey: 'test_demo_key' }, locationId: null, attempt: 1 }

describe('the provider registry', () => {
  it('lists Lightspeed K-Series, Zelty and Square as coming soon, and the Test POS as available', () => {
    expect(providerSummaries().map((provider) => [provider.key, provider.name, provider.status])).toEqual([
      ['lightspeed-k', 'Lightspeed K-Series', 'coming_soon'],
      ['zelty', 'Zelty', 'coming_soon'],
      ['square', 'Square', 'coming_soon'],
      ['test-pos', 'Test POS', 'available'],
    ])
  })

  it('never hands an adapter to the browser: a summary has no create', () => {
    for (const summary of providerSummaries()) expect(Object.keys(summary).sort()).toEqual(['auth', 'key', 'name', 'note', 'status'])
  })

  it('finds a provider by key, and nothing for an unknown one', () => {
    expect(providerOf('zelty')?.name).toBe('Zelty')
    expect(providerOf('nope')).toBeNull()
  })

  it('makes an adapter only for an available provider', () => {
    expect(adapterFor('test-pos', context)?.describe().name).toBe('Test POS')
    expect(adapterFor('square', context)).toBeNull()
    expect(adapterFor('nope', context)).toBeNull()
  })
})
