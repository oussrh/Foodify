// server/pos/claim.ts
// Taking due outbox rows for one worker, in one statement. A row is due when it is pending and its
// time has come, its connection is ACTIVE on a restaurant that has POS on, and no earlier row of
// its bill or of its ticket is still pending or has failed. The ticket half matters after a merge:
// a change keeps its ticket's row in order even once the ticket belongs to another bill. Due rows
// are locked with `FOR UPDATE SKIP LOCKED`, so a row another worker is claiming is skipped rather
// than waited for, and leased: their next attempt moves past the lease, their attempts count up
// and they carry this claim's token, so once the claim commits no other worker sees them as due
// until the lease runs out. Delivery is at least once: a worker that dies, or whose lease runs out
// mid-send, leaves the row to be sent again, and the adapter gets the row id as its idempotency key
// so the POS can recognise the second send. Only the claim still holding a row records its answer.
import { randomUUID } from 'node:crypto'
import { Prisma } from '@/generated/prisma/client'
import { BLOCKING_STATUSES, leaseUntil } from '@/lib/pos/outbox-rules'

/** Anything that runs raw SQL: the client, or a transaction. */
type Sql = Pick<Prisma.TransactionClient, '$queryRaw'>

/** Which rows to claim: one restaurant's or every one, due at `now`, at most `limit`. */
export type ClaimScope = { restaurantId?: string | undefined; now: Date; limit: number }

/** What a claim took: its token, and the rows it holds, oldest first. */
export type Claim = { token: string; ids: string[] }

/**
 * Claims up to `limit` due rows. Two workers claiming at once never take the same row: the second
 * skips what the first has locked.
 */
export async function claimDue(db: Sql, scope: ClaimScope): Promise<Claim> {
  const token = randomUUID()
  const restaurant = scope.restaurantId ? Prisma.sql`AND o."restaurantId" = ${scope.restaurantId}` : Prisma.empty
  const blocking = Prisma.join(BLOCKING_STATUSES.map((status) => Prisma.sql`${status}::"PosOutboxStatus"`))
  const rows = await db.$queryRaw<{ id: string; seq: number }[]>`
    UPDATE "PosOutbox" SET "attempts" = "attempts" + 1, "nextAttemptAt" = ${leaseUntil(scope.now)}, "claimToken" = ${token}
    WHERE "id" IN (
      SELECT o."id" FROM "PosOutbox" o
      JOIN "PosConnection" c ON c."id" = o."connectionId" AND c."status" = 'ACTIVE'
      JOIN "Restaurant" r ON r."id" = o."restaurantId" AND r."posEnabled"
      WHERE o."status" = 'PENDING' AND o."nextAttemptAt" <= ${scope.now} ${restaurant}
        AND NOT EXISTS (
          SELECT 1 FROM "PosOutbox" e
          WHERE (e."billId" = o."billId" OR e."orderId" = o."orderId") AND e."seq" < o."seq" AND e."status" IN (${blocking})
        )
      ORDER BY o."seq"
      LIMIT ${scope.limit}
      FOR UPDATE OF o SKIP LOCKED
    )
    RETURNING "id", "seq"`
  return { token, ids: rows.sort((a, b) => a.seq - b.seq).map((row) => row.id) }
}
