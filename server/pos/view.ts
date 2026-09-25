// server/pos/view.ts
// The Integrations tab's reading of one restaurant's POS (lib/pos/view.ts): whether this server
// can seal credentials, the providers, and the connection with its health: the outbox counted by
// state, the last sync and error, the menu changes waiting for review, how many dishes are matched. It reads the database only, never the POS, so a slow till cannot hold
// the page (the location step asks for the POS's locations itself). No credentials, no key: the
// page hands this to the browser as it is. The caller has guarded the restaurant.
import { serverEnv } from '@/lib/env'
import prisma from '@/lib/prisma'
import { providerOf, providerSummaries } from '@/lib/pos/registry'
import type { PosConnectionView, PosCounts, PosView } from '@/lib/pos/view'

const STATE_KEY = { PENDING: 'pending', SENT: 'sent', FAILED: 'failed', REFUSED: 'refused', DISCARDED: 'discarded' } as const

/** The outbox of `connectionId`, counted by state. */
async function countsOf(connectionId: string): Promise<PosCounts> {
  const groups = await prisma.posOutbox.groupBy({ by: ['status'], where: { connectionId }, _count: { _all: true } })
  const counts: PosCounts = { pending: 0, sent: 0, failed: 0, refused: 0, discarded: 0 }
  for (const group of groups) counts[STATE_KEY[group.status]] = group._count._all
  return counts
}

/** The connection of `restaurantId` as the health panel shows it, or null when there is none to show. */
async function connectionView(restaurantId: string): Promise<PosConnectionView | null> {
  const row = await prisma.posConnection.findUnique({
    where: { restaurantId },
    select: { id: true, provider: true, status: true, externalAccountId: true, externalLocationId: true, externalLocationName: true, lastSyncAt: true, lastError: true },
  })
  if (!row || row.status === 'NOT_CONNECTED') return null
  const [counts, menuChanges, dishes, mapped] = await Promise.all([
    countsOf(row.id),
    prisma.posInbox.count({ where: { connectionId: row.id, kind: 'MENU_CHANGED', appliedAt: null } }),
    prisma.dish.count({ where: { restaurantId, isActive: true } }),
    prisma.posItemMap.count({ where: { connectionId: row.id, dish: { isActive: true } } }),
  ])
  return {
    provider: row.provider,
    providerName: providerOf(row.provider)?.name ?? row.provider,
    status: row.status,
    accountId: row.externalAccountId,
    locationId: row.externalLocationId,
    locationName: row.externalLocationName,
    lastSyncAt: row.lastSyncAt?.toISOString() ?? null,
    lastError: row.lastError,
    counts,
    menuChanges,
    dishes,
    mapped,
  }
}

/** Everything the Integrations tab shows for `restaurantId`. */
export async function loadPosView(restaurantId: string): Promise<PosView> {
  return {
    restaurantId,
    configured: serverEnv.posEncryption !== null,
    providers: providerSummaries(),
    connection: await connectionView(restaurantId),
  }
}
