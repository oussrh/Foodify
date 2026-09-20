import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectArSupport } from './ar-support'

const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
const ANDROID = 'Mozilla/5.0 (Linux; Android 14)'
const DESKTOP = 'Mozilla/5.0 (Windows NT 10.0)'

const device = (userAgent: string, extra: Record<string, unknown> = {}) => vi.stubGlobal('navigator', { userAgent, ...extra })
const webxr = (answer: boolean | Error) => ({
  xr: { isSessionSupported: answer instanceof Error ? vi.fn().mockRejectedValue(answer) : vi.fn().mockResolvedValue(answer) },
})

describe('detectArSupport', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('is WebXR when the browser reports an immersive-ar session', async () => {
    device(DESKTOP, webxr(true))
    await expect(detectArSupport()).resolves.toEqual({ supported: true, mode: 'webxr' })
  })

  it('falls back to the platform viewer when WebXR says no', async () => {
    device(IOS, webxr(false))
    await expect(detectArSupport()).resolves.toEqual({ supported: true, mode: 'quick-look' })
    device(ANDROID, webxr(false))
    await expect(detectArSupport()).resolves.toEqual({ supported: true, mode: 'scene-viewer' })
    device(DESKTOP, webxr(false))
    await expect(detectArSupport()).resolves.toEqual({ supported: false, mode: null })
  })

  it('falls back the same way when the WebXR check throws', async () => {
    device(IOS, webxr(new Error('no xr')))
    await expect(detectArSupport()).resolves.toEqual({ supported: true, mode: 'quick-look' })
    device(DESKTOP, webxr(new Error('no xr')))
    await expect(detectArSupport()).resolves.toEqual({ supported: false, mode: null })
    expect(console.error).toHaveBeenCalledWith('WebXR support check failed:', expect.any(Error))
  })

  it('uses the platform viewer alone without WebXR', async () => {
    device(ANDROID)
    await expect(detectArSupport()).resolves.toEqual({ supported: true, mode: 'scene-viewer' })
    device(DESKTOP)
    await expect(detectArSupport()).resolves.toEqual({ supported: false, mode: null })
  })

  it('logs the camera permission first and survives a Permissions API that throws', async () => {
    device(DESKTOP, { permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) } })
    await detectArSupport()
    expect(console.log).toHaveBeenCalledWith('Camera permission status:', 'granted')
    device(DESKTOP, { permissions: { query: vi.fn().mockRejectedValue(new TypeError('camera is not a valid name')) } })
    await expect(detectArSupport()).resolves.toEqual({ supported: false, mode: null })
    expect(console.log).toHaveBeenCalledWith('Permission API not supported:', expect.any(TypeError))
  })
})
