// server/pos/connection.ts
// A stored connection made into the adapter that speaks for it: the credentials opened with the
// server's key (server/pos-crypto.ts) and handed to the provider's adapter (lib/pos/registry.ts),
// or the reason it cannot be, in words the owner can act on. The one place credentials are opened.
import type { Prisma } from '@/generated/prisma/client'
import prisma from '@/lib/prisma'
import type { PosAdapter, PosCredentials } from '@/lib/pos/contract'
import { adapterFor, providerOf } from '@/lib/pos/registry'
import { openCredentials, PosCryptoError } from '@/server/pos-crypto'

/** The columns an adapter is made from. */
export const CONNECTION_SELECT = {
  id: true,
  restaurantId: true,
  provider: true,
  status: true,
  credentials: true,
  credentialsKeyId: true,
  externalAccountId: true,
  externalLocationId: true,
} satisfies Prisma.PosConnectionSelect

/** A connection read with CONNECTION_SELECT. */
export type ConnectionRow = Prisma.PosConnectionGetPayload<{ select: typeof CONNECTION_SELECT }>

/**
 * A connection's adapter for its `attempt`-th try (1 for the first) and the credentials it was made
 * with (for `connect`, which takes them again), or why there is none.
 */
export function openAdapter(connection: ConnectionRow, attempt = 1): { adapter: PosAdapter; credentials: PosCredentials } | { error: string } {
  if (!connection.credentials || !connection.credentialsKeyId) return { error: 'This POS is not signed in' }
  let credentials
  try {
    credentials = openCredentials({ credentials: connection.credentials, keyId: connection.credentialsKeyId }, connection.restaurantId)
  } catch (error) {
    if (error instanceof PosCryptoError) return { error: error.message }
    throw error
  }
  const adapter = adapterFor(connection.provider, { credentials, locationId: connection.externalLocationId, attempt })
  if (!adapter) return { error: `${providerOf(connection.provider)?.name ?? 'This POS'} cannot be connected yet` }
  return { adapter, credentials }
}

/** The restaurant's connection, or null when it has never had one. */
export function readConnection(restaurantId: string) {
  return prisma.posConnection.findUnique({ where: { restaurantId }, select: CONNECTION_SELECT })
}

/**
 * Marks every row of `where.connectionId` still waiting to be sent as DISCARDED, and answers how
 * many: what the POS will now never be sent, kept for the record.
 */
export async function discardWaiting(tx: Prisma.TransactionClient, where: { connectionId: string }): Promise<number> {
  const discarded = await tx.posOutbox.updateMany({ where: { ...where, status: { in: ['PENDING', 'FAILED'] } }, data: { status: 'DISCARDED', claimToken: null } })
  return discarded.count
}
