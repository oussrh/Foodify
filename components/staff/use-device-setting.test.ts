import { afterEach, describe, expect, it, vi } from 'vitest'
import { readDeviceSetting, writeDeviceSetting } from './use-device-setting'

/** A window whose localStorage is a plain map, as a reload would find it. */
function fakeStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    },
  })
  return store
}

describe('the device setting', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('falls back until something is remembered', () => {
    fakeStorage()
    expect(readDeviceSetting('foodify-screen-awake', false)).toBe(false)
    expect(readDeviceSetting('foodify-board-sound', true)).toBe(true)
  })

  it('reads back what was written, whatever the fallback: the choice survives a reload', () => {
    const store = fakeStorage()
    writeDeviceSetting('foodify-screen-awake', true)
    expect(store.get('foodify-screen-awake')).toBe('on')
    expect(readDeviceSetting('foodify-screen-awake', false)).toBe(true)
    writeDeviceSetting('foodify-board-sound', false)
    expect(readDeviceSetting('foodify-board-sound', true)).toBe(false)
  })

  it('falls back, and never throws, where storage is refused', () => {
    const refuse = () => {
      throw new DOMException('denied', 'SecurityError')
    }
    vi.stubGlobal('window', { localStorage: { getItem: refuse, setItem: refuse } })
    expect(() => writeDeviceSetting('foodify-screen-awake', true)).not.toThrow()
    expect(readDeviceSetting('foodify-screen-awake', false)).toBe(false)
  })
})
