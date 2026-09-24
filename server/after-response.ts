// server/after-response.ts
// Work that must not hold the response: a push to the staff devices after an order is placed or
// called up. Next's `after()` runs it once the response has gone and keeps a serverless instance
// alive until it settles. Outside a request (a test calling a route handler or an action
// directly) `after()` throws; the work is then started at once and not awaited, so the caller
// behaves the same either way.
import { after } from 'next/server'
import { log } from '@/server/log'

/** Runs `task` after the response, or now and unawaited when there is no request to wait for. A rejection is logged, never thrown. */
export function afterResponse(task: () => Promise<unknown>): void {
  const run = () => task().catch((error: unknown) => log.error({ err: error }, 'after-response: task failed'))
  try {
    after(run)
  } catch {
    void run()
  }
}
