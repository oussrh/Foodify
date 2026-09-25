// app/api/health/route.ts
// What a deploy and a balancer read (OBS.1): 200 when this instance can answer a request that
// needs the database, 503 with the reason when it cannot or is draining. No cache, no session,
// no input: the answer is the instance's state and nothing else, plus the public build id it runs
// (the same one the browser bundle carries), which the installed staff apps compare with their own
// to learn that a new version was deployed (components/staff/use-staff-update.ts).
import { fail, ok } from '@/lib/api'
import { publicEnv } from '@/lib/env'
import prisma from '@/lib/prisma'
import { isDraining } from '@/server/drain'
import { log } from '@/server/log'

/** Next 16 does not prerender a route handler unless asked; this pins that, so a future default cannot bake a health answer at build that says "ok" for good. */
export const dynamic = 'force-dynamic'

/**
 * Draining answers 503 `draining` before the database is asked, so a balancer drops this instance
 * while its requests in flight finish; a database that does not answer `SELECT 1` is 503
 * `unavailable` with the failure logged; otherwise 200 `{ status: 'ok', database: 'ok', build }`.
 */
export async function GET(): Promise<Response> {
  if (isDraining()) return fail('draining', 'Shutting down', 503)
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch (err) {
    log.error({ err }, 'health: the database did not answer')
    return fail('unavailable', 'Database unreachable', 503)
  }
  return ok({ status: 'ok', database: 'ok', build: publicEnv.buildId })
}
