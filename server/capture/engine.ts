// server/capture/engine.ts
// The capture engine's HTTP API, from our side (its side: services/capture-engine/engine/service.py).
// Our calls carry the shared secret as a bearer token. The browser's calls (sending each file,
// loading the model into the preview) go straight to the engine on an address signed here with the
// same secret: HMAC-SHA256 of "METHOD path name expiry" (`name` is the file an upload sends, empty for
// a GET), so a signature is good for one method on one path and one file, until it expires. The
// engine is reached at its origin: a path prefix would be signed wrong.
import crypto from 'node:crypto'
import { serverEnv } from '@/lib/env'
import { engineStatus, type EngineStatus } from '@/lib/schemas/capture'

/** The engine is not configured, refused a call, or did not answer in time. */
export class CaptureEngineError extends Error {}

/** The files a finished job serves. */
export type EngineFile = 'dish.glb' | 'dish.usdz'

/** What the engine is told to make, in its own parameter names. */
export type EngineParams = { plate_cm: number; base_logo?: string; base_text?: string }

function engine() {
  const configured = serverEnv.captureEngine
  if (!configured) throw new CaptureEngineError('The capture engine is not configured')
  return configured
}

/**
 * An address the browser may use for `method` on `path` for `ttlSeconds`, without the secret. An
 * upload names its file (`name`), which is signed too: the address sends that one file and no other.
 */
export function signedEngineUrl(method: 'GET' | 'PUT', path: string, ttlSeconds: number, options: { name?: string; now?: number } = {}): string {
  const { url, secret } = engine()
  const name = options.name ?? ''
  const exp = Math.floor((options.now ?? Date.now()) / 1000) + ttlSeconds
  const sig = crypto.createHmac('sha256', secret).update(`${method} ${path} ${name} ${exp}`).digest('hex')
  return `${url}${path}?${name ? `name=${encodeURIComponent(name)}&` : ''}exp=${exp}&sig=${sig}`
}

async function call(path: string, init: RequestInit, timeoutMs = 15_000): Promise<Response> {
  const { url, secret } = engine()
  let response: Response
  try {
    response = await fetch(`${url}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    throw new CaptureEngineError(`The capture engine did not answer (${error instanceof Error ? error.name : 'error'})`)
  }
  if (!response.ok) throw new CaptureEngineError(`The capture engine answered ${response.status} to ${init.method} ${path}`)
  return response
}

/** Starts a job whose video the engine already has. */
export async function startEngineJob(jobId: string, params: EngineParams): Promise<void> {
  await call(`/jobs/${jobId}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) })
}

/** Where a job is, and its report once it has finished. An answer of another shape is the engine misbehaving, like no answer. */
export async function engineJobStatus(jobId: string): Promise<EngineStatus> {
  const response = await call(`/jobs/${jobId}`, { method: 'GET' })
  const parsed = engineStatus.safeParse(await response.json().catch(() => null))
  if (!parsed.success) throw new CaptureEngineError('The capture engine answered in a shape Foodify does not read')
  return parsed.data
}

/** One of a finished job's files, whole. */
export async function engineFile(jobId: string, name: EngineFile): Promise<Uint8Array<ArrayBuffer>> {
  const response = await call(`/jobs/${jobId}/files/${name}`, { method: 'GET' }, 60_000)
  return new Uint8Array(await response.arrayBuffer())
}
