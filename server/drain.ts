// server/drain.ts
// What SIGTERM does to this process (OBS.1): the health check fails first, so a balancer stops
// routing here while the requests in flight finish; nothing exits on the spot. Next's own handler
// (`next start`, registered before ours) closes the HTTP server, waits for the pending requests
// and exits 143, so on an ordinary stop the process is gone before the grace ends and the pool
// goes with it; the release below runs only when a request outlives the grace. Registered once
// per module instance, from instrumentation.ts (a dev hot reload re-evaluates the module).
import { log } from './log'

let draining = false
let unregister: (() => void) | null = null

/** Whether the process was told to stop; the health endpoint answers 503 from the moment this is true. */
export const isDraining = () => draining

/** What the drain needs from its caller, injected so a test can run it without a database or a real exit. */
export type DrainOptions = {
  /** How long the requests in flight get before the pool is released, in milliseconds. */
  graceMs: number
  /** Releases what the process holds (the database pool); its failure is logged, never thrown. */
  release: () => Promise<void>
  /** Ends the process once released; the default lets Next's own handler exit (it does, with 143). */
  exit?: (code: number) => void
}

/**
 * Registers the SIGTERM handler once and returns what removes it. On the signal: mark draining
 * (the health check fails at once), wait the grace period on a timer that does not keep the
 * process alive, release, then hand the exit to `exit` when one is given. A second call in the
 * same process returns the first's remover instead of stacking a handler.
 */
export function registerDrain(options: DrainOptions): () => void {
  if (unregister) return unregister
  const onSigterm = () => {
    if (draining) return // a shell forwards the signal twice; one drain is enough
    draining = true
    log.warn({ graceMs: options.graceMs }, 'SIGTERM: draining, health now fails, requests in flight finish')
    const timer = setTimeout(async () => {
      try {
        await options.release()
        log.info('drained: released what the process held')
      } catch (err) {
        log.error({ err }, 'drain: release failed')
      }
      options.exit?.(0)
    }, options.graceMs)
    timer.unref()
  }
  process.on('SIGTERM', onSigterm)
  unregister = () => {
    process.removeListener('SIGTERM', onSigterm)
    draining = false
    unregister = null
  }
  return unregister
}
