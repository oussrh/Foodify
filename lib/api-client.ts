// lib/api-client.ts
// The browser side of lib/api.ts: a call that unwraps `{ data }` or throws the failure's code,
// and one that follows `meta.next` until a list is complete. Client-safe (no server import).

/**
 * What `call` throws for any answer that is not a success envelope: `code` is the failure's own,
 * or 'unknown' when the body was not one (a proxy page, a 500 without JSON, a 2xx with a bad
 * body), so a caller switches on `code` and shows `message` instead of reading the response.
 */
export class ApiError extends Error {
  code: string
  status: number
  /** Whatever the handler passed to `fail`: zod issues, or the dishes an order was refused over. */
  details: unknown
  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

type Success<T> = { data: T; meta?: { next?: string | null } }
type Failure = { error: string; code: string; details?: unknown }
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null
const isSuccess = <T>(b: unknown): b is Success<T> => isObject(b) && 'data' in b
const isFailure = (b: unknown): b is Failure => isObject(b) && typeof b.code === 'string' && typeof b.error === 'string'

/**
 * One request to a route handler, unwrapped: the envelope's `data` and its `meta.next` cursor
 * (null when the list is complete or the route is not a list). A non-2xx status, or a body
 * without `data` even on 2xx, throws ApiError; `init` goes to fetch untouched.
 */
export async function call<T>(input: string, init?: RequestInit): Promise<{ data: T; next: string | null }> {
  const res = await fetch(input, init)
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok || !isSuccess<T>(body)) {
    const failure: Failure = isFailure(body) ? body : { code: 'unknown', error: `HTTP ${res.status}` }
    throw new ApiError(failure.code, failure.error, res.status, failure.details)
  }
  return { data: body.data, next: body.meta?.next ?? null }
}

/** Every row of a followable list, page after page. */
export async function callAll<T>(url: string): Promise<T[]> {
  const rows: T[] = []
  let cursor: string | null = null
  do {
    const sep = url.includes('?') ? '&' : '?'
    const pageOf: { data: T[]; next: string | null } = await call<T[]>(cursor ? `${url}${sep}cursor=${cursor}` : url)
    rows.push(...pageOf.data)
    cursor = pageOf.next
  } while (cursor)
  return rows
}
