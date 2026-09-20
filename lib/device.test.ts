import { afterEach, describe, expect, it, vi } from 'vitest'
import { isAndroid, isIOS } from './device'

const browser = (userAgent: string, extra: Record<string, unknown> = {}) => {
  vi.stubGlobal('navigator', { userAgent })
  vi.stubGlobal('window', extra)
}

describe('isIOS', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('recognises iPhone, iPad and iPod user agents', () => {
    browser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    expect(isIOS()).toBe(true)
    browser('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')
    expect(isIOS()).toBe(true)
  })

  it('is false for Android and desktop browsers', () => {
    browser('Mozilla/5.0 (Linux; Android 14; Pixel 8)')
    expect(isIOS()).toBe(false)
    browser('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
    expect(isIOS()).toBe(false)
  })

  it('excludes the old IE mobile agent that spoofed an iPhone', () => {
    browser('Mozilla/5.0 (iPhone; like Mac OS X) IEMobile', { MSStream: {} })
    expect(isIOS()).toBe(false)
  })
})

describe('isAndroid', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('recognises an Android user agent and nothing else', () => {
    browser('Mozilla/5.0 (Linux; Android 14; Pixel 8)')
    expect(isAndroid()).toBe(true)
    browser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    expect(isAndroid()).toBe(false)
  })
})
