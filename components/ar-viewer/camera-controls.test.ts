import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetCamera, shareViewer, zoomCamera } from './camera-controls'
import type { ModelViewer } from '@/components/model-viewer/element'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

/** A viewer holding one attribute, camera-orbit, the way the controls read and write it. */
const viewer = (orbit?: string) => {
  let current = orbit
  const el = {
    getAttribute: (name: string) => (name === 'camera-orbit' ? current ?? null : null),
    setAttribute: (_name: string, value: string) => void (current = value),
    resetTurntableRotation: vi.fn(),
    jumpCameraToGoal: vi.fn(),
  }
  return { el: el as unknown as ModelViewer, orbit: () => current, el_: el }
}

describe('zoomCamera', () => {
  afterEach(() => vi.clearAllMocks())

  it('starts from 100% when the radius is auto, then steps by 10%', () => {
    const v = viewer()
    zoomCamera(v.el, 'in')
    expect(v.orbit()).toBe('45deg 75deg 80%')
    zoomCamera(v.el, 'in')
    expect(v.orbit()).toBe('45deg 75deg 70%')
    zoomCamera(v.el, 'out')
    expect(v.orbit()).toBe('45deg 75deg 80%')
    expect(toast.success).toHaveBeenNthCalledWith(1, 'Zoomed in')
    expect(toast.success).toHaveBeenNthCalledWith(3, 'Zoomed out')
  })

  it('treats an explicit 100% like auto and keeps the angles', () => {
    const v = viewer('10deg 20deg 100%')
    zoomCamera(v.el, 'out')
    expect(v.orbit()).toBe('10deg 20deg 120%')
  })

  it('stops at 50% in and 200% out', () => {
    const near = viewer('0deg 0deg 55%')
    zoomCamera(near.el, 'in')
    expect(near.orbit()).toBe('0deg 0deg 50%')
    const far = viewer('0deg 0deg 195%')
    zoomCamera(far.el, 'out')
    expect(far.orbit()).toBe('0deg 0deg 200%')
  })
})

describe('resetCamera', () => {
  it('resets the turntable, jumps the camera and restores the default orbit', () => {
    const v = viewer('0deg 0deg 60%')
    resetCamera(v.el)
    expect(v.el_.resetTurntableRotation).toHaveBeenCalled()
    expect(v.el_.jumpCameraToGoal).toHaveBeenCalled()
    expect(v.orbit()).toBe('45deg 75deg auto')
    expect(toast.success).toHaveBeenCalledWith('View reset')
  })
})

describe('shareViewer', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('shares through the Web Share API with the mode in the title', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })
    vi.stubGlobal('window', { location: { href: 'https://foodify.app/ar-viewer?model=m' } })
    await shareViewer('Tagine', 'ar')
    expect(share).toHaveBeenCalledWith({ title: 'Tagine - AR Model', text: 'Check out this interactive AR model of Tagine!', url: 'https://foodify.app/ar-viewer?model=m' })
    expect(toast.success).toHaveBeenCalledWith('Shared successfully!')
  })

  it('copies the link when sharing is refused or missing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.stubGlobal('window', { location: { href: 'https://foodify.app/x' } })
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('cancelled')), clipboard: { writeText } })
    await shareViewer('Tagine', '3d')
    expect(writeText).toHaveBeenCalledWith('https://foodify.app/x')
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await shareViewer('Tagine', '3d')
    expect(writeText).toHaveBeenCalledTimes(2)
    expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!')
    vi.restoreAllMocks()
  })
})
