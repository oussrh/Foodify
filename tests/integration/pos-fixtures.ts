// tests/integration/pos-fixtures.ts
// A restaurant's point of sale for the POS suites: the server's sealing key (a test key, set
// before anything reads the environment), a restaurant with POS switched on, a Test POS
// connection sealed the way connectPos seals one, and the outbox read back. Importing this module
// sets the key, so every POS suite imports it first.
import { afterAll, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as placeOrder } from '@/app/api/orders/route'
import { sealCredentials } from '@/server/pos-crypto'
import type { Tx } from './db'
import { floor } from './bill-fixtures'
import { dish } from './fixtures'

/** The sealing key of the POS suites: 32 bytes, base64. Only ever a test's. */
export const TEST_POS_KEY = 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY='
/** The cron's bearer secret in the POS suites. */
export const TEST_CRON_SECRET = 'cron-secret-of-the-test-suite'

vi.stubEnv('POS_ENCRYPTION_KEY', TEST_POS_KEY)
vi.stubEnv('CRON_SECRET', TEST_CRON_SECRET)
afterAll(() => vi.unstubAllEnvs())

/** The Test POS location every fixture connection sends to. */
export const LOCATION = 'tpos-dining-room'

/** A restaurant taking orders with POS switched on (`enabled` false leaves it off), its staff, and a dish. */
export async function posFloor(tx: Tx, { enabled = true }: { enabled?: boolean } = {}) {
  const staff = await floor(tx)
  await tx.restaurant.update({ where: { id: staff.place.id }, data: { posEnabled: enabled } })
  const harira = await dish(tx, staff.place.id, { nameEn: 'Harira' })
  return { ...staff, harira }
}

/** A Test POS connection of `restaurantId` under `apiKey`, at `status`, sending to LOCATION. */
export async function connection(tx: Tx, restaurantId: string, { apiKey = 'test_demo_key', status = 'ACTIVE' as const }: { apiKey?: string; status?: 'ACTIVE' | 'PAUSED' | 'MAPPING' | 'ERROR' } = {}) {
  const sealed = sealCredentials({ apiKey }, restaurantId)
  return tx.posConnection.create({
    data: { restaurantId, provider: 'test-pos', status, externalAccountId: 'tpos-account-test', externalLocationId: LOCATION, credentials: sealed.credentials, credentialsKeyId: sealed.keyId },
    select: { id: true },
  })
}

/** The restaurant's outbox, oldest first. */
export function outbox(tx: Tx, restaurantId: string) {
  return tx.posOutbox.findMany({
    where: { restaurantId },
    orderBy: { seq: 'asc' },
    select: { id: true, kind: true, status: true, orderId: true, billId: true, changeId: true, attempts: true, nextAttemptAt: true, lastAnswer: true, externalId: true },
  })
}

/** POST /api/orders as whoever is signed in; answers the new order's id, or throws with the status. */
export async function place(body: Record<string, unknown>): Promise<string> {
  const res = await placeOrder(new NextRequest('http://test/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }))
  if (res.status !== 201) throw new Error(`order refused: ${res.status} ${await res.text()}`)
  return ((await res.json()) as { data: { id: string } }).data.id
}
