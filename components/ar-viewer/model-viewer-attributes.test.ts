import { afterEach, describe, expect, it, vi } from 'vitest'
import { apply3dAttributes, applyArAttributes, applyBaseAttributes } from './model-viewer-attributes'

/** The attribute surface the builders touch, on a plain object: the element itself needs a DOM. */
const fakeElement = () => {
  const attrs = new Map<string, string>()
  const el = {
    setAttribute: (name: string, value: string) => void attrs.set(name, value),
    removeAttribute: (name: string) => void attrs.delete(name),
  } as unknown as HTMLElement
  return { el, attrs: () => Object.fromEntries(attrs) }
}

const withUserAgent = (userAgent: string) => vi.stubGlobal('navigator', { userAgent })

describe('model-viewer attributes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('3D mode: turntable, indoor lighting, a camera that stays above the dish, no AR', () => {
    const { el, attrs } = fakeElement()
    applyBaseAttributes(el, 'https://x/m.glb', 'Tagine')
    apply3dAttributes(el)
    expect(attrs()).toEqual({
      src: 'https://x/m.glb',
      alt: '3D model of Tagine',
      'camera-controls': '',
      'touch-action': 'pan-y',
      loading: 'eager',
      reveal: 'auto',
      'shadow-intensity': '0.8',
      'shadow-softness': '0.6',
      exposure: '1.2',
      'tone-mapping': 'commerce',
      'auto-rotate': '',
      'auto-rotate-delay': '1000',
      'rotation-per-second': '20deg',
      'environment-image': 'https://modelviewer.dev/shared-assets/environments/moon_1k.hdr',
      'skybox-height': '2m',
      'min-camera-orbit': 'auto 0deg auto',
      'max-camera-orbit': 'auto 180deg auto',
      'camera-orbit': '45deg 75deg auto',
    })
  })

  it('AR mode on a desktop: every AR launch mode, real-world lighting, no turntable', () => {
    withUserAgent('Mozilla/5.0 (Windows NT 10.0)')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const { el, attrs } = fakeElement()
    applyBaseAttributes(el, 'https://x/m.glb', 'Tagine')
    applyArAttributes(el, 'https://x/m.glb', null)
    expect(attrs()).toEqual({
      src: 'https://x/m.glb',
      alt: '3D model of Tagine',
      'camera-controls': 'enable-pan',
      'touch-action': 'manipulation',
      loading: 'eager',
      reveal: 'auto',
      'shadow-intensity': '0.9',
      'shadow-softness': '0.7',
      exposure: '1.3',
      'tone-mapping': 'commerce',
      ar: '',
      'ar-modes': 'webxr scene-viewer quick-look',
      'ar-scale': 'auto',
      'ar-placement': 'floor',
      'xr-environment': '',
      'disable-pan': 'false',
      'disable-zoom': 'false',
      'interaction-policy': 'always-allow',
      'environment-image': 'https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr',
      'skybox-image': 'null',
      'min-camera-orbit': 'auto 0deg auto',
      'max-camera-orbit': 'auto 180deg auto',
      'min-field-of-view': '25deg',
      'max-field-of-view': '45deg',
    })
    expect(console.log).toHaveBeenCalledWith('AR mode configured for:', null, 'Device:', 'Desktop')
  })

  it('AR mode on iOS: the USDZ twin as ios-src for Quick Look', () => {
    withUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const { el, attrs } = fakeElement()
    applyArAttributes(el, 'https://x/m.glb', 'quick-look')
    expect(attrs()['ios-src']).toBe('https://x/m.usdz')
    expect(attrs()['quick-look-browsers']).toBe('safari chrome')
    expect(attrs()['ar-modes']).toBe('webxr scene-viewer quick-look')
    expect(console.log).toHaveBeenCalledWith('AR mode configured for:', 'quick-look', 'Device:', 'iOS')
  })

  it('AR mode on Android: Scene Viewer first', () => {
    withUserAgent('Mozilla/5.0 (Linux; Android 14)')
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const { el, attrs } = fakeElement()
    applyArAttributes(el, 'https://x/m.glb', 'scene-viewer')
    expect(attrs()['ar-modes']).toBe('scene-viewer webxr')
    expect(attrs()['ios-src']).toBeUndefined()
    expect(console.log).toHaveBeenCalledWith('AR mode configured for:', 'scene-viewer', 'Device:', 'Android')
  })
})
