import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** An AudioContext that starts suspended, as every one does before a tap, and runs when resumed. */
class FakeAudioContext extends EventTarget {
  static made = 0
  state: AudioContextState = 'suspended'
  constructor() {
    super()
    FakeAudioContext.made += 1
  }
  resume() {
    this.state = 'running'
    this.dispatchEvent(new Event('statechange'))
    return Promise.resolve()
  }
  interrupt() {
    this.state = 'suspended'
    this.dispatchEvent(new Event('statechange'))
  }
}

// The store is module state: each test gets a fresh copy of it.
const load = () => import('./audio-context')

describe('the page audio context', () => {
  beforeEach(() => {
    vi.resetModules()
    FakeAudioContext.made = 0
    vi.stubGlobal('window', { AudioContext: FakeAudioContext })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('is not running until something wakes it, which is what a reload leaves', async () => {
    const audio = await load()
    expect(audio.audioRunning()).toBe(false)
    audio.wakeAudio()
    expect(audio.audioRunning()).toBe(true)
  })

  it('is one context for the page, however many screens wake it', async () => {
    const audio = await load()
    const first = audio.wakeAudio()
    expect(audio.wakeAudio()).toBe(first)
    expect(FakeAudioContext.made).toBe(1)
  })

  it('tells its subscribers when it starts and when the device suspends it again', async () => {
    const audio = await load()
    const listener = vi.fn()
    const unsubscribe = audio.subscribeAudio(listener)
    const context = audio.wakeAudio() as unknown as FakeAudioContext
    expect(listener).toHaveBeenCalled()
    listener.mockClear()
    context.interrupt()
    expect(listener).toHaveBeenCalledTimes(1)
    expect(audio.audioRunning()).toBe(false)
    unsubscribe()
    context.resume()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('is null, and never running, where the device has no audio', async () => {
    vi.stubGlobal('window', {})
    const audio = await load()
    expect(audio.audioContextClass()).toBeUndefined()
    expect(audio.wakeAudio()).toBeNull()
    expect(audio.audioRunning()).toBe(false)
  })
})
