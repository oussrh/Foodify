// lib/pos/registry.ts
// Every point of sale Foodify knows, by the key a connection stores: its name, how an owner signs
// in to it, whether it can be connected yet, and the adapter that speaks to it. The three vendors
// are listed before their adapters exist, so an owner sees they are coming rather than nothing;
// connecting one is refused until its adapter is written and its status turns available. This
// module reaches `node:crypto` through the Test POS: the browser gets the list from the page
// (`providerSummaries`), never by importing it.
import type { PosAdapter, PosAdapterContext, PosAdapterFactory, PosAuthKind } from './contract'
import { createTestAdapter, TEST_POS } from './test-adapter'

/** Whether a provider can be connected today. */
export type ProviderStatus = 'available' | 'coming_soon'

/** A provider as the Integrations tab lists it: no adapter, which never leaves the server. */
export interface ProviderSummary {
  key: string
  name: string
  auth: PosAuthKind
  status: ProviderStatus
  /** One line under the name: what it is, or when to expect it. */
  note: string
}

type Provider = ProviderSummary & { create: PosAdapterFactory | null }

const PROVIDERS: readonly Provider[] = [
  { key: 'lightspeed-k', name: 'Lightspeed K-Series', auth: 'oauth', status: 'coming_soon', note: 'Lightspeed’s restaurant POS, connected with your Lightspeed sign-in.', create: null },
  { key: 'zelty', name: 'Zelty', auth: 'api_key', status: 'coming_soon', note: 'The restaurant POS many French kitchens run, connected with an API key.', create: null },
  { key: 'square', name: 'Square', auth: 'oauth', status: 'coming_soon', note: 'Square for Restaurants, connected with your Square sign-in.', create: null },
  { key: TEST_POS, name: 'Test POS', auth: 'api_key', status: 'available', note: 'A pretend till for trying the connection: nothing reaches a real POS.', create: createTestAdapter },
]

/** Every provider, in the order the Integrations tab lists them, without their adapters. */
export function providerSummaries(): ProviderSummary[] {
  return PROVIDERS.map(({ key, name, auth, status, note }) => ({ key, name, auth, status, note }))
}

/** The provider stored under `key`, or null for a key the registry does not know. */
export function providerOf(key: string): ProviderSummary | null {
  const found = PROVIDERS.find((provider) => provider.key === key)
  return found ? { key: found.key, name: found.name, auth: found.auth, status: found.status, note: found.note } : null
}

/** The adapter for `key` made for one connection, or null when the provider is unknown or not available yet. */
export function adapterFor(key: string, context: PosAdapterContext): PosAdapter | null {
  const found = PROVIDERS.find((provider) => provider.key === key)
  if (!found || found.status !== 'available' || !found.create) return null
  return found.create(context)
}
