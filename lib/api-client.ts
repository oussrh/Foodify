// lib/api-client.ts
// The browser side of lib/api.ts: a call that unwraps `{ data }` or throws the failure's code,
// and one that follows `meta.next` until a list is complete. Client-safe (no server import).

export class ApiError extends Error {
  code: string
  status: number
  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

type Envelope<T> = { data: T; meta?: { next?: string | null } } | { error: string; code: string }

export async function call<T>(input: string, init?: RequestInit): Promise<{ data: T; next: string | null }> {
  const res = await fetch(input, init)
  const body = (await res.json().catch(() => null)) as Envelope<T> | null
  if (!res.ok || !body || !('data' in body)) {
    const failure = body && 'code' in body ? body : { code: 'unknown', error: `HTTP ${res.status}` }
    throw new ApiError(failure.code, failure.error, res.status)
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
