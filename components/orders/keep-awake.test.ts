import { describe, expect, it, vi } from 'vitest'
import { keepScreenAwake, type LockPage, type ScreenLock, type ScreenLockApi } from './keep-awake'

/** A page: an event target that says whether it is showing. */
function fakePage(): LockPage & { show: (visible: boolean) => void; tap: () => void } {
  const page = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState })
  return Object.assign(page, {
    show(visible: boolean) {
      page.visibilityState = visible ? 'visible' : 'hidden'
      page.dispatchEvent(new Event('visibilitychange'))
    },
    tap() {
      page.dispatchEvent(new Event('pointerup'))
      page.dispatchEvent(new Event('click'))
    },
  })
}

/** A lock the browser can drop, the way it does when the page is hidden. */
function fakeLock(): ScreenLock & { drop: () => void } {
  const target = new EventTarget()
  const lock = {
    released: false,
    release: vi.fn(async () => {
      lock.drop()
    }),
    addEventListener: (type: 'release', listener: () => void) => target.addEventListener(type, listener),
    drop() {
      lock.released = true
      target.dispatchEvent(new Event('release'))
    },
  }
  return lock
}

/** A wake-lock API that answers each request with the next of `answers`: a lock, or a refusal. */
function fakeApi(answers: Array<'grant' | 'refuse'>) {
  const locks: ReturnType<typeof fakeLock>[] = []
  const request = vi.fn(async () => {
    if (answers.shift() === 'refuse') throw new DOMException('A gesture is needed', 'NotAllowedError')
    const lock = fakeLock()
    locks.push(lock)
    return lock
  })
  const api: ScreenLockApi = { request }
  return { api, request, locks }
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('keepScreenAwake', () => {
  it('takes the lock at once: a remembered "on" holds the screen after a reload with no tap', async () => {
    const { api, request } = fakeApi(['grant'])
    const onHeld = vi.fn()
    keepScreenAwake(api, fakePage(), onHeld)
    await settle()
    expect(request).toHaveBeenCalledTimes(1)
    expect(onHeld).toHaveBeenLastCalledWith(true)
  })

  it('takes it again when the page comes back after the browser dropped it', async () => {
    const { api, request, locks } = fakeApi(['grant', 'grant'])
    const page = fakePage()
    const onHeld = vi.fn()
    keepScreenAwake(api, page, onHeld)
    await settle()
    page.show(false)
    locks[0]?.drop()
    expect(onHeld).toHaveBeenLastCalledWith(false)
    page.show(true)
    await settle()
    expect(request).toHaveBeenCalledTimes(2)
    expect(onHeld).toHaveBeenLastCalledWith(true)
  })

  it('asks again on the next tap anywhere after a refusal, and only once for that tap', async () => {
    const { api, request } = fakeApi(['refuse', 'grant'])
    const page = fakePage()
    const onHeld = vi.fn()
    keepScreenAwake(api, page, onHeld)
    await settle()
    expect(onHeld).not.toHaveBeenCalled()
    page.tap()
    await settle()
    expect(request).toHaveBeenCalledTimes(2)
    expect(onHeld).toHaveBeenLastCalledWith(true)
    page.tap()
    await settle()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('keeps listening through a tap whose first event is refused, until a lock is held', async () => {
    const { api, request } = fakeApi(['refuse', 'refuse', 'grant'])
    const page = fakePage()
    const onHeld = vi.fn()
    keepScreenAwake(api, page, onHeld)
    await settle()
    page.tap()
    await settle()
    expect(onHeld).not.toHaveBeenCalled()
    page.tap()
    await settle()
    expect(request).toHaveBeenCalledTimes(3)
    expect(onHeld).toHaveBeenLastCalledWith(true)
  })

  it('releases the lock and stops listening once stopped', async () => {
    const { api, request, locks } = fakeApi(['grant'])
    const page = fakePage()
    const stop = keepScreenAwake(api, page, vi.fn())
    await settle()
    stop()
    expect(locks[0]?.release).toHaveBeenCalled()
    page.show(true)
    page.tap()
    await settle()
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('lets go of a lock that arrives after it was stopped', async () => {
    const { api, locks } = fakeApi(['grant'])
    const onHeld = vi.fn()
    const stop = keepScreenAwake(api, fakePage(), onHeld)
    stop()
    await settle()
    expect(locks[0]?.release).toHaveBeenCalled()
    expect(onHeld).not.toHaveBeenCalledWith(true)
  })
})
