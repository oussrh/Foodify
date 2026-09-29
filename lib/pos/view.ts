// lib/pos/view.ts
// The Integrations tab's reading of one restaurant's POS, as the page hands it to the browser
// (server/pos/view.ts builds it). Nothing secret is in it: no credentials, no key, no payload.
import type { PosStatus } from '@/generated/prisma/client'
import type { ProviderSummary } from './registry'

/** How many outbox rows stand in each state. */
export interface PosCounts {
  /** Waiting to be sent: during a pause, what Resume asks about. */
  pending: number
  sent: number
  failed: number
  refused: number
  discarded: number
}

/** A connection as the health panel shows it. */
export interface PosConnectionView {
  provider: string
  providerName: string
  status: PosStatus
  accountId: string | null
  locationId: string | null
  /** The chosen location's name as the POS gave it. */
  locationName: string | null
  lastSyncAt: string | null
  lastError: string | null
  counts: PosCounts
  /** Menu changes the POS reported that the owner has not reviewed yet. */
  menuChanges: number
  /** Active dishes, and how many of them are matched to a POS item. */
  dishes: number
  mapped: number
}

/** Everything the Integrations tab needs for one restaurant. */
export interface PosView {
  restaurantId: string
  /** Whether this server has a key to seal credentials with. */
  configured: boolean
  providers: ProviderSummary[]
  connection: PosConnectionView | null
}
