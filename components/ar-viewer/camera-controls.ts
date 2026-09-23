// components/ar-viewer/camera-controls.ts
// The viewer's camera actions on the <model-viewer> element: reset to the default orbit, zoom
// in or out by stepping the orbit radius, and share the page (the Web Share API, or the
// clipboard when it is missing or refuses).
import { toast } from 'sonner'
import type { ModelViewer, ViewMode } from '@/components/model-viewer/element'

/** theta, phi, radius: the orbit <model-viewer> starts from and returns to. */
const DEFAULT_ORBIT_PARTS = ['45deg', '75deg', 'auto'] as const
const DEFAULT_ORBIT = DEFAULT_ORBIT_PARTS.join(' ')

/** Reset camera view */
export function resetCamera(modelViewer: ModelViewer) {
  modelViewer.resetTurntableRotation()
  if (modelViewer.jumpCameraToGoal) {
    modelViewer.jumpCameraToGoal()
  }
  // Reset to default camera orbit
  modelViewer.setAttribute('camera-orbit', DEFAULT_ORBIT)
  toast.success('View reset')
}

/** The next radius of the orbit: 10% closer or farther, between 50% and 200%, from 100% when it is auto. */
function steppedDistance(distance: string, direction: 'in' | 'out') {
  if (distance === 'auto' || distance === '100%') return direction === 'in' ? '80%' : '120%'
  return direction === 'in' ? `${Math.max(50, parseInt(distance) - 10)}%` : `${Math.min(200, parseInt(distance) + 10)}%`
}

/**
 * Moves the camera one step in or out by changing only the orbit radius, ten points at a time
 * between 50% and 200%. An 'auto' radius counts as 100%, and a toast confirms each step.
 */
export function zoomCamera(modelViewer: ModelViewer, direction: 'in' | 'out') {
  const currentOrbit = modelViewer.getAttribute('camera-orbit') || DEFAULT_ORBIT
  // A part the attribute lacks is the default orbit's.
  const [theta = DEFAULT_ORBIT_PARTS[0], phi = DEFAULT_ORBIT_PARTS[1], radius = DEFAULT_ORBIT_PARTS[2]] = currentOrbit.split(' ')
  const distance = radius === 'auto' ? '100%' : radius
  modelViewer.setAttribute('camera-orbit', `${theta} ${phi} ${steppedDistance(distance, direction)}`)
  toast.success(direction === 'in' ? 'Zoomed in' : 'Zoomed out')
}

/** Share model */
export async function shareViewer(dishName: string, viewMode: ViewMode) {
  const modeLabel = viewMode === 'ar' ? 'AR' : '3D'
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${dishName} - ${modeLabel} Model`,
        text: `Check out this interactive ${modeLabel} model of ${dishName}!`,
        url: window.location.href,
      })
      toast.success('Shared successfully!')
    } catch (err) {
      console.log('Error sharing:', err)
      // Fallback: copy to clipboard
      await navigator.clipboard?.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  } else {
    // Fallback: copy to clipboard
    await navigator.clipboard?.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }
}
