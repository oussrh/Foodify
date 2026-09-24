// tests/integration/setup.ts
// The code under test imports the client singleton (`@/lib/prisma`) and the session (`@/auth`).
// Here the singleton is the running test's transaction, so every guard, action and query runs
// on the real database and is rolled back; the session is whatever the test signed in as.
import { afterAll, afterEach, vi } from 'vitest'
import { currentTx, db } from './db'
import { session, signInAs } from './session'

/**
 * `prisma.$transaction` inside the test's own transaction: a transaction client has none, and a
 * nested one is the enclosing one (Postgres has no nested transactions, and the test's rollback
 * must undo it too). The callback form runs on the open transaction, so a row it locks stays
 * locked until the test ends; the array form runs its queries in order on it.
 */
async function nested(work: unknown) {
  if (typeof work === 'function') return work(currentTx())
  const results: unknown[] = []
  for (const query of work as Promise<unknown>[]) results.push(await query)
  return results
}

vi.mock('@/lib/prisma', () => ({
  default: new Proxy(
    {},
    {
      // Every property read (`prisma.dish`, `prisma.$queryRaw`) goes to the open transaction.
      get: (_target, property) => (property === '$transaction' ? nested : Reflect.get(currentTx(), property)),
    },
  ),
}))

vi.mock('@/auth', () => ({ auth: async () => session.current }))

// Server actions revalidate the dashboards; outside a request there is nothing to revalidate.
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

// A test that forgets to sign in must not inherit the previous test's user, whose row is gone.
afterEach(() => signInAs(null))

afterAll(async () => {
  await db.$disconnect()
})
