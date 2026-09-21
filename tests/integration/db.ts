// tests/integration/db.ts
// The test database and the transaction every test runs in. TEST_DATABASE_URL is the only
// variable read: never DATABASE_URL, so the suite cannot run against the database the
// developer's .env points at. Each test gets a Prisma transaction client; the code under test
// reaches it through the `@/lib/prisma` mock in setup.ts, and the transaction is rolled back
// at the end whatever happened, so a test never sees another's rows and the seed stays intact.
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from '@/generated/prisma/client'

const url = process.env.TEST_DATABASE_URL
if (!url) throw new Error('TEST_DATABASE_URL is not set; run the suite through `pnpm test:integration`')

export const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

export type Tx = Prisma.TransactionClient

class Rollback extends Error {
  constructor() {
    super('rolled back on purpose')
    this.name = 'Rollback'
  }
}

let current: Tx | null = null

/** The transaction the running test is in; the `@/lib/prisma` mock hands it to the code under test. */
export function currentTx(): Tx {
  if (!current) throw new Error('no transaction is open: is the test wrapped in withRollback?')
  return current
}

/** Runs `fn` inside a transaction that is always rolled back. A thrown error still propagates. */
export async function withRollback(fn: (tx: Tx) => Promise<void>): Promise<void> {
  let failure: unknown = null
  try {
    await db.$transaction(
      async (tx) => {
        current = tx
        try {
          await fn(tx)
        } catch (error) {
          failure = error
        }
        throw new Rollback()
      },
      { timeout: 30_000, maxWait: 10_000 },
    )
  } catch (error) {
    if (!(error instanceof Rollback)) throw error
  } finally {
    current = null
  }
  if (failure) throw failure
}
