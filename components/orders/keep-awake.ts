// components/orders/keep-awake.ts
// Holding a screen awake is three jobs, and a lock taken once does only the first. The lock is
// dropped by the browser whenever the page is hidden, so it is taken again when the page comes
// back. And after a reload it may be refused outright — some iOS versions grant it only inside a
// tap, and a remembered "on" has had no tap yet — so a refusal waits for the next tap anywhere on
// the page and asks again. Plain code over the two browser objects it needs, so the three can be
// tested without a browser; `use-wake-lock.ts` is the React side.
import { listenForGestures } from '@/components/staff/gestures'

/** The part of a `WakeLockSentinel` this uses. */
export interface ScreenLock {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

/** The part of `navigator.wakeLock` this uses. */
export interface ScreenLockApi {
  request: (type: 'screen') => Promise<ScreenLock>
}

/** The part of `document` this uses: whether the page is showing, and where to hear taps. */
export type LockPage = EventTarget & { visibilityState: DocumentVisibilityState }

const ignore = () => undefined

/**
 * Holds the screen awake until the returned function is called: now, again whenever the page
 * becomes visible, and again on the next tap after a refusal. `onHeld` hears whether a lock is held.
 */
export function keepScreenAwake(api: ScreenLockApi, page: LockPage, onHeld: (held: boolean) => void): () => void {
  let current: ScreenLock | null = null
  let asking = false
  let live = true
  let stopWaiting: (() => void) | null = null

  // Listening goes on until a lock is actually held: one tap fires several events, and which of
  // them a browser counts as the gesture differs (WebKit's is `touchend`), so a refused ask on the
  // first of them must not use the tap up.
  const waitForTap = () => {
    stopWaiting ??= listenForGestures(page, () => void take())
  }
  const stopWaitingForTap = () => {
    stopWaiting?.()
    stopWaiting = null
  }

  const take = async () => {
    if (asking || (current && !current.released)) return
    asking = true
    try {
      const lock = await api.request('screen')
      if (!live) {
        void lock.release().catch(ignore)
        return
      }
      current = lock
      stopWaitingForTap()
      lock.addEventListener('release', () => {
        if (current === lock) onHeld(false)
      })
      onHeld(true)
    } catch {
      // Refused: a browser that wants a tap first (NotAllowedError), a battery saver, a hidden
      // page. Showing, the next tap asks again; hidden, coming back into view does.
      if (live && page.visibilityState === 'visible') waitForTap()
    } finally {
      asking = false
    }
  }

  const onVisible = () => {
    if (page.visibilityState === 'visible') void take()
  }

  void take()
  page.addEventListener('visibilitychange', onVisible)
  return () => {
    live = false
    stopWaitingForTap()
    page.removeEventListener('visibilitychange', onVisible)
    void current?.release().catch(ignore)
  }
}
