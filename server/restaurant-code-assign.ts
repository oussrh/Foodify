// server/restaurant-code-assign.ts
// Giving a new restaurant its short code. Server-only: it writes, and it retries against the
// unique index rather than checking for a free code first — checking first is a race, and the
// index is not. Six Crockford characters is a billion possibilities, so the loop is a formality
// that will nonetheless be the thing that saves us the day it is not.
import { Prisma } from '@/generated/prisma/client'
import { newRestaurantCode } from '@/lib/restaurant-code'

/** How many draws before giving up. A collision needs two of a billion; ten in a row is a broken generator, not bad luck. */
const ATTEMPTS = 10

/** Prisma's code for a unique-constraint violation. */
const UNIQUE_VIOLATION = 'P2002'

/**
 * Whether a failed create means "that code is taken" and nothing else. A taken slug is also a
 * P2002 and must not be retried nine more times: it would turn a caller's mistake into what looks
 * like flakiness, and the caller would never see the error that explains it.
 */
function isCodeCollision(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== UNIQUE_VIOLATION) return false
  // `target` names the constraint that failed; only the code's is ours to retry.
  return String(error.meta?.['target'] ?? '').includes('code')
}

/**
 * Runs `create` with a fresh code, redrawing when the index says that one is taken. Anything the
 * create throws for any other reason is rethrown untouched, on the first attempt.
 */
export async function withRestaurantCode<T>(create: (code: string) => Promise<T>): Promise<T> {
  let collision: unknown
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    try {
      return await create(newRestaurantCode())
    } catch (error) {
      if (!isCodeCollision(error)) throw error
      collision = error
    }
  }
  // Ten collisions in a row: the generator is broken, or the table is full. Either way the last
  // one Postgres reported says more than anything this could invent.
  throw collision
}
