// lib/api.ts
// The one response shape of the route handlers (API.1): `{ data }` or `{ data, meta }` on
// success, `{ error, code, details? }` on failure, the code one of a closed set a client can
// switch on and the error a sentence for a log. A handler never builds a Response itself.

/** Every failure code a handler may answer; a client switching on them cannot fall through a typo. */
export type ApiCode = 'unauthenticated' | 'forbidden' | 'invalid_query' | 'invalid_id' | 'invalid_json' | 'invalid_payload' | 'not_found' | 'internal'
export type ApiFailure = { error: string; code: ApiCode; details?: unknown }

export function ok<T>(data: T, options: { meta?: Record<string, unknown>; status?: number } = {}): Response {
  const body = options.meta ? { data, meta: options.meta } : { data }
  return Response.json(body, options.status ? { status: options.status } : undefined)
}

export function fail(code: ApiCode, error: string, status: number, details?: unknown): Response {
  const body: ApiFailure = details === undefined ? { error, code } : { error, code, details }
  return Response.json(body, { status })
}
