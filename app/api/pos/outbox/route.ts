// app/api/pos/outbox/route.ts
// The POS outbox's sweep, as Vercel's cron calls it (vercel.json, daily on the Hobby plan; every
// minute on Pro, docs/DEPLOYMENT.md). It picks up whatever the other two triggers missed: a
// response that ended before its sweep ran, or a restaurant whose boards were closed, for every
// restaurant at once. Vercel sends `Authorization: Bearer $CRON_SECRET`; without the variable set
// on the server, every call is refused, so the route is never open by omission.
import { fail, ok } from '@/lib/api'
import { serverEnv } from '@/lib/env'
import { cronAuthorization } from '@/lib/schemas/pos'
import { deliverDue } from '@/server/pos/deliver'
import { sameSecret } from '@/server/secret'

/** A sweep sends; it is never prerendered or cached. */
export const dynamic = 'force-dynamic'

/**
 * GET, Vercel's cron only: `Authorization: Bearer <CRON_SECRET>`, else 401 unauthenticated (and
 * always 401 while CRON_SECRET is unset). Sends every due outbox row of every restaurant, bounded
 * per call, and answers 200 `{ data: { sent, retried, failed, refused, errors } }`: a row or a
 * claim that fails is logged and counted in `errors`, never a 500.
 */
export async function GET(request: Request): Promise<Response> {
  const token = cronAuthorization.safeParse(request.headers.get('authorization') ?? '')
  const secret = serverEnv.cronSecret
  if (!secret || !token.success || !sameSecret(token.data, secret)) return fail('unauthenticated', 'This is the cron’s route', 401)
  return ok(await deliverDue())
}
