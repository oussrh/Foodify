import { afterEach, describe, expect, it, vi } from 'vitest'
import { isDraining, registerDrain } from './drain'

// The worker has no SIGTERM listener of its own (checked), so a synthetic emit reaches only ours;
// Node kills nothing on an emitted signal, only on a delivered one.
const sigterm = () => process.emit('SIGTERM', 'SIGTERM')

describe('the SIGTERM drain', () => {
  let unregister: (() => void) | undefined
  afterEach(() => {
    unregister?.()
    unregister = undefined
    vi.useRealTimers()
  })

  it('fails the health flag at once, releases only after the grace, then hands over the exit', async () => {
    vi.useFakeTimers()
    const release = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const exit = vi.fn<(code: number) => void>()
    unregister = registerDrain({ graceMs: 1000, release, exit })
    expect(isDraining()).toBe(false)
    sigterm()
    expect(isDraining()).toBe(true)
    expect(release).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(999)
    expect(release).not.toHaveBeenCalled()
    expect(exit).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(release).toHaveBeenCalledTimes(1)
    expect(exit).toHaveBeenCalledWith(0)
  })

  it('still hands over the exit when the release fails', async () => {
    vi.useFakeTimers()
    const exit = vi.fn<(code: number) => void>()
    unregister = registerDrain({ graceMs: 10, release: () => Promise.reject(new Error('pool already closed')), exit })
    sigterm()
    await vi.advanceTimersByTimeAsync(10)
    expect(exit).toHaveBeenCalledWith(0)
  })

  it('registers once and drains once: a second registration returns the first remover, a second signal is ignored', async () => {
    vi.useFakeTimers()
    const release = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    unregister = registerDrain({ graceMs: 10, release })
    expect(registerDrain({ graceMs: 999, release })).toBe(unregister)
    expect(process.listenerCount('SIGTERM')).toBe(1)
    sigterm()
    sigterm()
    await vi.advanceTimersByTimeAsync(10)
    expect(release).toHaveBeenCalledTimes(1)
  })

  it('leaves no listener and no flag behind once unregistered', () => {
    unregister = registerDrain({ graceMs: 10, release: async () => {} })
    sigterm()
    expect(isDraining()).toBe(true)
    unregister()
    unregister = undefined
    expect(isDraining()).toBe(false)
    expect(process.listenerCount('SIGTERM')).toBe(0)
  })
})
