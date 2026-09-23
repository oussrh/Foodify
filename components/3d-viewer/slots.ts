// components/3d-viewer/slots.ts
// The two slots the 3D page fills in its <model-viewer>: the loading poster and the error
// panel, both on the same dark ground.

/**
 * Builds the `slot="poster"` element model-viewer shows until the model is revealed. It is plain
 * DOM, not React, because the viewer element is built by hand.
 */
export function createPoster(): HTMLDivElement {
  const poster = document.createElement('div')
  poster.setAttribute('slot', 'poster')
  poster.className = 'absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-900 to-black'
  poster.innerHTML = `
        <div class="text-center text-white space-y-6">
          <div class="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <svg class="h-8 w-8 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div class="space-y-2">
            <p class="text-lg font-medium">Loading 3D model...</p>
            <p class="text-sm text-gray-400">This may take a moment</p>
          </div>
        </div>
      `
  return poster
}

/**
 * Builds the `slot="error"` element that model-viewer shows when the model itself fails to load. It
 * is plain DOM, not React, because the viewer element is built by hand.
 */
export function createErrorSlot(): HTMLDivElement {
  const errorSlot = document.createElement('div')
  errorSlot.setAttribute('slot', 'error')
  errorSlot.className = 'absolute inset-0 flex items-center justify-center bg-linear-to-br from-gray-900 to-black'
  errorSlot.innerHTML = `
        <div class="text-center text-white space-y-4">
          <svg class="h-16 w-16 text-red-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div class="space-y-2">
            <h2 class="text-xl font-bold">Failed to load model</h2>
            <p class="text-gray-400">Please check the model URL and try again</p>
          </div>
        </div>
      `
  return errorSlot
}
