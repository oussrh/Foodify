import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker } from './use-pwa'

// A stand-in for navigator.serviceWorker: records the listeners so a test can fire one by name.
function fakeServiceWorker(controller: object | null) {
  const listeners: Record<string, () => void> = {}
  const sw = {
    controller,
    addEventListener: (type: string, fn: () => void) => {
      listeners[type] = fn
    },
    removeEventListener: () => {},
    register: () => new Promise(() => {}), // never settles: the registration itself is not under test
    ready: new Promise(() => {}),
  }
  vi.stubGlobal('navigator', { serviceWorker: sw })
  vi.stubGlobal('window', {})
  return (type: string) => {
    const listener = listeners[type]
    if (!listener) throw new Error(`nothing listens for ${type}`)
    listener()
  }
}

const handlers = () => ({ onPrecached: vi.fn(), onUpdateReady: vi.fn(), onControllerChange: vi.fn(), sendPrecache: vi.fn() })

describe('registerServiceWorker: a change of controller', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('ignores the first claim on a page that had no controller (a first visit, not an update)', () => {
    const fire = fakeServiceWorker(null)
    const h = handlers()
    registerServiceWorker(h)
    fire('controllerchange')
    expect(h.onControllerChange).not.toHaveBeenCalled()
  })

  it('reports the next change on that same page: the one Refresh asks for', () => {
    const fire = fakeServiceWorker(null)
    const h = handlers()
    registerServiceWorker(h)
    fire('controllerchange')
    fire('controllerchange')
    expect(h.onControllerChange).toHaveBeenCalledTimes(1)
  })

  it('reports the first change on a page that already had a controller', () => {
    const fire = fakeServiceWorker({})
    const h = handlers()
    registerServiceWorker(h)
    fire('controllerchange')
    expect(h.onControllerChange).toHaveBeenCalledTimes(1)
  })

  it('reports an update once, however many changes follow', () => {
    const fire = fakeServiceWorker({})
    const h = handlers()
    registerServiceWorker(h)
    fire('controllerchange')
    fire('controllerchange')
    expect(h.onControllerChange).toHaveBeenCalledTimes(1)
  })
})
