// instrumentation.ts
// Next runs `register` once per server runtime at boot: the place for what belongs to the
// process rather than to a request. The drain is Node-only (a signal and a pool). The runtime
// check reads `process.env.NEXT_RUNTIME` as a literal, the one raw read outside lib/env: the
// bundler eliminates the other runtime's branch (and its imports) only when it sees the literal,
// so this file is named beside the env module in abatty.config.json (ratchet.envModule).

/** Ten seconds: longer than any request here, shorter than what a platform allows before it kills the instance. */
const DRAIN_GRACE_MS = 10_000

/** Registers the SIGTERM drain on the Node runtime; the exit stays with Next's own handler. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const [{ registerDrain }, { default: prisma }] = await Promise.all([import('@/server/drain'), import('@/lib/prisma')])
  registerDrain({ graceMs: DRAIN_GRACE_MS, release: () => prisma.$disconnect() })
}
