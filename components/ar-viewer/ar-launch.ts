// components/ar-viewer/ar-launch.ts
// What the AR mode adds to the <model-viewer>: the session listeners (status, camera,
// tracking under WebXR) and the launch button in the ar-button slot, with its haptic and
// camera-permission touch feedback and its "activating" state on click.
import { toast } from 'sonner'
import type { ArMode } from '@/components/model-viewer/element'

/** Add AR-specific event listeners */
export function attachArEvents(modelViewer: HTMLElement, arMode: ArMode | null) {
  modelViewer.addEventListener('ar-status', (event) => {
    const { status } = (event as CustomEvent<{ status: string }>).detail // model-viewer dispatches CustomEvents; lib.dom types listeners as Event
    console.log('AR status:', status)
    if (status === 'session-started') {
      toast.success('AR camera activated!')
    } else if (status === 'failed') {
      console.error('AR session failed')
      toast.error('AR camera failed to start. Please check permissions.')
    }
  })

  modelViewer.addEventListener('camera-change', () => {
    console.log('AR camera view changed')
  })

  // Handle WebXR session events
  if (arMode === 'webxr') {
    modelViewer.addEventListener('ar-tracking', (event) => {
      console.log('AR tracking status:', (event as CustomEvent<{ status: string }>).detail) // same: a CustomEvent from model-viewer
    })
  }
}

const AR_BUTTON_CLASS = 'absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white px-7 py-4 md:px-8 rounded-full shadow-2xl font-semibold flex items-center gap-2 md:gap-3 whitespace-nowrap transition-all duration-300 transform hover:scale-105 ring-2 ring-white/40 backdrop-blur-xs text-base active:scale-95 touch-manipulation z-10'

const ACTIVATING_CONTENT = `
            <svg class="w-4 h-4 md:w-5 md:h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="font-medium">Activating AR Camera...</span>
          `

const arModeLabel = (arMode: ArMode | null) =>
  arMode === 'webxr' ? 'WebXR' :
  arMode === 'quick-look' ? 'iOS AR' :
  arMode === 'scene-viewer' ? 'Android AR' : ''

const arButtonContent = (arMode: ArMode | null) => `
          <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span class="font-medium">Open AR Camera</span>
          ${arMode ? `<span class="bg-white/25 text-white text-xs px-2 py-0.5 rounded-full hidden md:inline">${arModeLabel(arMode)}</span>` : ''}
        `

/** Enhanced mobile feedback and camera preparation */
async function prepareCamera() {
  // Haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate(50)
  }

  // Pre-check camera permissions for better UX
  try {
    if ('permissions' in navigator) {
      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (cameraPermission.state === 'denied') {
        console.warn('Camera permission denied - AR may not work properly')
      }
    }
  } catch (error) {
    console.log('Permission check failed:', error)
  }
}

/** Create enhanced AR button only for AR mode */
export function createArButton(arMode: ArMode | null): HTMLButtonElement {
  const content = arButtonContent(arMode)
  const arButton = document.createElement('button')
  arButton.setAttribute('slot', 'ar-button')
  arButton.className = AR_BUTTON_CLASS

  arButton.addEventListener('touchstart', prepareCamera)

  // Add click handler for better camera activation
  arButton.addEventListener('click', async () => {
    console.log('AR button clicked, preparing camera...')

    // Add loading state to button
    arButton.innerHTML = ACTIVATING_CONTENT

    // Reset button after delay
    setTimeout(() => {
      arButton.innerHTML = content
    }, 3000)
  })

  arButton.innerHTML = content
  return arButton
}
