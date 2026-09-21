// lib/api.ts
// The one response shape of the route handlers (API.1): `{ data }` or `{ data, meta }` on
// success, `{ error, code, details? }` on failure, the code one of a closed set a client can
// switch on and the error a sentence for a log. A handler never builds a Response itself.

/** Every failure code a handler may answer; a client switching on them cannot fall through a typo. */
export type ApiCode = 'unauthenticated' | 'forbidden' | 'invalid_query' | 'invalid_id' | 'invalid_json' | 'invalid_payload' | 'not_found' | 'internal' | 'unavailable' | 'draining'
/** The failure body as `fail` writes it; `details` exists only when the handler passed some (Zod issues, mostly), so a client cannot rely on it. */
export type ApiFailure = { error: string; code: ApiCode; details?: unknown }

/**
 * The success envelope. `meta` (a list's `next` cursor) is left out of the body when not given
 * rather than sent as null, and the status is 200 unless the handler passes one (201 on a create).
 */
export function ok<T>(data: T, options: { meta?: Record<string, unknown>; status?: number } = {}): Response {
  const body = options.meta ? { data, meta: options.meta } : { data }
  return Response.json(body, options.status ? { status: options.status } : undefined)
}

/**
 * The failure envelope. `error` is a sentence for a log or a toast, never a stack or a secret;
 * `details` (Zod issues, usually) is added only when given, so an absent one is absent, not null.
 */
export function fail(code: ApiCode, error: string, status: number, details?: unknown): Response {
  const body: ApiFailure = details === undefined ? { error, code } : { error, code, details }
  return Response.json(body, { status })
}
