// lib/staff-build.ts
// Whether a staff device is running an older build than the server now serves. The staff worker's
// bytes are the same in every build (its version is the `?v=` of the address it was registered
// with), so the browser's own update check never sees a deploy; the app asks GET /api/health for
// the build it answers from, and registers the worker again under that build when it differs.
import { z } from 'zod'

/** A build id as lib/env.ts makes one: a short commit hash or a set id, never anything to build an address from. */
const buildId = z.string().regex(/^[A-Za-z0-9._-]{1,64}$/)

/** The part of the health answer this reads: `{ data: { build } }`. */
const healthBody = z.object({ data: z.object({ build: buildId }) })

/**
 * The build to install, read from a health answer's body: the server's build when it is a
 * well-formed id and not the one this page runs. Null for the same build, an unreadable answer,
 * and a development server (`dev`), which has no worker to update.
 */
export function newerBuild(current: string, body: unknown): string | null {
  const parsed = healthBody.safeParse(body)
  if (!parsed.success) return null
  const served = parsed.data.data.build
  return served === current || served === 'dev' ? null : served
}
