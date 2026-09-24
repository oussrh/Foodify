// server/pos/setup.ts
// The first three steps of connecting a POS: sign in to it (the credentials checked by the POS,
// then sealed), test that it still answers, and choose the location tickets go to. Each answers
// an outcome in the owner's words rather than throwing, because a refusal here is something to
// read and act on (a mistyped key), not a bug. Signing in to another account, or choosing another
// location than before, drops the old item matches and discards the rows still waiting: they were
// meant for a till this connection no longer speaks to. The caller has guarded the restaurant.
import type { Prisma } from '@/generated/prisma/client'
import { serverEnv } from '@/lib/env'
import prisma from '@/lib/prisma'
import { answerOf, type PosLocation } from '@/lib/pos/contract'
import { adapterFor, providerOf } from '@/lib/pos/registry'
import { POS_NOT_CONFIGURED } from '@/lib/pos/status'
import type { PosConnectInput } from '@/lib/schemas/pos'
import { sealCredentials } from '@/server/pos-crypto'
import { discardWaiting, openAdapter, readConnection } from '@/server/pos/connection'

/** What a POS action came to: done, with what it answers; or why not, in the owner's words. */
export type PosOutcome<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string }

/** A connection past this point sends: it is switched off (paused or disconnected) before another is made. */
const LIVE = new Set(['ACTIVE', 'PAUSED'])

/** Drops a connection's item matches and discards its waiting rows, in one transaction with `then`. */
async function forgetTill(connectionId: string, then: (tx: Prisma.TransactionClient) => Promise<unknown>) {
  await prisma.$transaction(async (tx) => {
    await tx.posItemMap.deleteMany({ where: { connectionId } })
    await discardWaiting(tx, { connectionId })
    await then(tx)
  })
}

/**
 * Signs `restaurantId` in to the POS `input.provider` with `input.apiKey`. The POS checks the key;
 * only a key it took is sealed and stored, with the account it named and the connection waiting
 * for a location (the previous one is kept for the same account). Refused while another
 * connection is live, for a provider not available yet, and on a server with no key to seal with.
 * Answers the locations to choose from.
 */
export async function connectPos(restaurantId: string, input: PosConnectInput): Promise<PosOutcome<{ locations: PosLocation[] }>> {
  const provider = providerOf(input.provider)
  if (!provider) return { ok: false, error: 'Choose a POS from the list' }
  const credentials = { apiKey: input.apiKey }
  const adapter = adapterFor(provider.key, { credentials, locationId: null, attempt: 1 })
  if (!adapter) return { ok: false, error: `${provider.name} is coming soon` }
  if (!serverEnv.posEncryption) return { ok: false, error: POS_NOT_CONFIGURED }
  const existing = await readConnection(restaurantId)
  if (existing && LIVE.has(existing.status)) return { ok: false, error: 'Disconnect the current POS before connecting another' }

  const answer = await answerOf(() => adapter.connect(credentials))
  if (answer.kind !== 'ok') return { ok: false, error: answer.reason }
  const sealed = sealCredentials(credentials, restaurantId)
  const sameTill = existing !== null && existing.provider === provider.key && existing.externalAccountId === answer.accountId
  const data = { provider: provider.key, status: 'CONNECTING' as const, externalAccountId: answer.accountId, credentials: sealed.credentials, credentialsKeyId: sealed.keyId, lastError: null, ...(sameTill ? {} : { externalLocationId: null, externalLocationName: null }) }
  const write = (tx: Prisma.TransactionClient) => tx.posConnection.upsert({ where: { restaurantId }, create: { restaurantId, ...data }, update: data, select: { id: true } })
  if (existing && !sameTill) await forgetTill(existing.id, write)
  else await write(prisma)
  return { ok: true, locations: answer.locations }
}

/**
 * Asks the connected POS whether it still answers. A refusal means the credentials no longer work:
 * the connection turns ERROR and stops sending until it is connected again. A connection in ERROR
 * that answers again is left paused (or waiting for its location), for the owner to resume.
 */
export async function testPos(restaurantId: string): Promise<PosOutcome<{ message: string }>> {
  const connection = await readConnection(restaurantId)
  if (!connection) return { ok: false, error: 'Connect a POS first' }
  const opened = openAdapter(connection)
  const answer = 'error' in opened ? { kind: 'retry' as const, reason: opened.error } : await answerOf(() => opened.adapter.test())
  if (answer.kind === 'ok') {
    const recovered = connection.externalLocationId ? 'PAUSED' : 'CONNECTING'
    await prisma.posConnection.update({ where: { id: connection.id }, data: { lastError: null, lastSyncAt: new Date(), status: connection.status === 'ERROR' ? recovered : connection.status }, select: { id: true } })
    return { ok: true, message: answer.note ?? 'The POS answered' }
  }
  const status = answer.kind === 'refused' ? 'ERROR' : connection.status
  await prisma.posConnection.update({ where: { id: connection.id }, data: { lastError: answer.reason, status }, select: { id: true } })
  return { ok: false, error: answer.reason }
}

/** The locations the connected POS lists now (at most 20 seconds' wait), or why they cannot be read. */
export async function listLocations(restaurantId: string): Promise<PosOutcome<{ locations: PosLocation[] }>> {
  const connection = await readConnection(restaurantId)
  if (!connection) return { ok: false, error: 'Connect a POS first' }
  const opened = openAdapter(connection)
  if ('error' in opened) return { ok: false, error: opened.error }
  const { adapter, credentials } = opened
  const answer = await answerOf(() => adapter.connect(credentials))
  return answer.kind === 'ok' ? { ok: true, locations: answer.locations } : { ok: false, error: `Could not read the POS’s locations: ${answer.reason}` }
}

/**
 * Chooses the location tickets go to: one the POS lists now, before the connection is active.
 * The connection moves on to matching the dishes; a location other than the one chosen before
 * drops the old matches and discards what was waiting for it.
 */
export async function choosePosLocation(restaurantId: string, locationId: string): Promise<PosOutcome<{ locationId: string }>> {
  const connection = await readConnection(restaurantId)
  if (!connection || (connection.status !== 'CONNECTING' && connection.status !== 'MAPPING')) return { ok: false, error: 'Connect a POS first' }
  const listed = await listLocations(restaurantId)
  if (!listed.ok) return listed
  const location = listed.locations.find((candidate) => candidate.id === locationId)
  if (!location) return { ok: false, error: 'That location is not one this POS lists' }
  const write = (tx: Prisma.TransactionClient) =>
    tx.posConnection.update({ where: { id: connection.id }, data: { externalLocationId: location.id, externalLocationName: location.name, status: 'MAPPING' }, select: { id: true } })
  const moved = connection.externalLocationId !== null && connection.externalLocationId !== location.id
  if (moved) await forgetTill(connection.id, write)
  else await write(prisma)
  return { ok: true, locationId }
}
