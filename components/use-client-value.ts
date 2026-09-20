'use client'

import { useSyncExternalStore } from 'react'

const never = () => () => {}

/**
 * A value that exists only in the browser (user agent, matchMedia, storage). The server and the
 * hydration pass render `serverValue`; the first client render reads it, with no setState in an
 * effect and no hydration mismatch. `read` must return a primitive or a stable reference: React
 * calls it on every render and treats a fresh object as a change.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(never, read, () => serverValue)
}
