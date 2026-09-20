// lib/api.ts
// The one response shape of the route handlers (API.1): `{ data }` or `{ data, meta }` on
// success, `{ error, code, details? }` on failure, the code a stable snake_case word a client
// can switch on and the error a sentence for a log. A handler never builds a Response itself.

export type ApiFailure = { error: string; code: string; details?: unknown }

export function ok<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit): Response {
  return Response.json(meta ? { data, meta } : { data }, init)
}

export function fail(code: string, error: string, status: number, details?: unknown): Response {
  const body: ApiFailure = details === undefined ? { error, code } : { error, code, details }
  return Response.json(body, { status })
}
