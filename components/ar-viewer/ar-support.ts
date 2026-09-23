// components/ar-viewer/ar-support.ts
// What AR this device can open: WebXR when the browser reports an immersive-ar session,
// otherwise the platform's own viewer (Quick Look on iPhone and iPad, Scene Viewer on
// Android), otherwise none. The camera permission is logged first, as the page always did.
import type { ArMode } from '@/components/model-viewer/element'

export interface ArSupport {
  supported: boolean
  mode: ArMode | null
}

/** lib.dom has no WebXR types; the `'xr' in navigator` test below guards the call. */
type NavigatorWithXr = Navigator & { xr: { isSessionSupported(mode: string): Promise<boolean> } }

const platformArMode = (): ArMode | null => {
  if (/iPhone|iPad/.test(navigator.userAgent)) return 'quick-look'
  if (/Android/.test(navigator.userAgent)) return 'scene-viewer'
  return null
}

/** iOS AR Quick Look is always supported; Android Scene Viewer is usually supported. */
const platformSupport = (): ArSupport => {
  const mode = platformArMode()
  return { supported: mode !== null, mode }
}

async function logCameraPermission() {
  // Check camera permissions first
  try {
    if ('permissions' in navigator) {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      console.log('Camera permission status:', cameraPermission.state)
    }
  } catch (error) {
    console.log('Permission API not supported:', error)
  }
}

/**
 * Decides which AR this device can open: WebXR when the browser supports an immersive-ar session,
 * else Quick Look on iPhone/iPad or Scene Viewer on Android, else none. It also logs the camera
 * permission first.
 */
export async function detectArSupport(): Promise<ArSupport> {
  await logCameraPermission()

  // No WebXR, but platform AR might still work
  if (!('xr' in navigator)) return platformSupport()

  // Check for WebXR support with better error handling
  try {
    const supported = await (navigator as NavigatorWithXr).xr.isSessionSupported('immersive-ar')
    console.log('WebXR immersive-ar supported:', supported)
    if (supported) return { supported: true, mode: 'webxr' }
  } catch (error) {
    console.error('WebXR support check failed:', error)
  }
  // Fallback to platform-specific AR
  return platformSupport()
}
