// tests/integration/setup.ts
// The code under test imports the client singleton (`@/lib/prisma`) and the session (`@/auth`).
// Here the singleton is the running test's transaction, so every guard, action and query runs
// on the real database and is rolled back; the session is whatever the test signed in as.
import { afterAll, vi } from 'vitest'
import { currentTx, db } from './db'
import { session } from './session'

vi.mock('@/lib/prisma', () => ({
  default: new Proxy(
    {},
    {
      // Every property read (`prisma.dish`, `prisma.$queryRaw`) goes to the open transaction.
      get: (_target, property) => Reflect.get(currentTx(), property),
    },
  ),
}))

vi.mock('@/auth', () => ({ auth: async () => session.current }))

// Server actions revalidate the dashboards; outside a request there is nothing to revalidate.
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

afterAll(async () => {
  await db.$disconnect()
})
