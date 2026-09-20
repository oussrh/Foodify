// components/ar-viewer/poster.ts
// The loading poster in the <model-viewer>'s poster slot: a dark spinner for AR mode, a light
// one for 3D mode, with the line that says which model is coming.
import type { ViewMode } from '@/components/model-viewer/element'

export function createPoster(viewMode: ViewMode): HTMLDivElement {
  const poster = document.createElement('div')
  poster.setAttribute('slot', 'poster')
  poster.className = `absolute inset-0 flex items-center justify-center ${
    viewMode === 'ar'
      ? 'bg-linear-to-br from-purple-900 via-black to-indigo-900'
      : 'bg-linear-to-br from-slate-100 via-white to-slate-200'
  }`
  poster.innerHTML = `
        <div class="text-center ${viewMode === 'ar' ? 'text-white' : 'text-gray-800'} space-y-4">
          <div class="relative">
            <svg class="h-12 w-12 animate-spin ${viewMode === 'ar' ? 'text-purple-400' : 'text-blue-500'} mx-auto" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="absolute inset-0 ${viewMode === 'ar' ? 'bg-purple-500/20' : 'bg-blue-500/20'} rounded-full animate-pulse"></div>
          </div>
          <div class="space-y-2">
            <p class="text-lg font-medium">Loading ${viewMode === 'ar' ? 'AR' : '3D'} model...</p>
            <p class="text-sm ${viewMode === 'ar' ? 'text-gray-400' : 'text-gray-600'}">
              ${viewMode === 'ar' ? 'Preparing your AR camera experience' : 'Preparing 3D viewer'}
            </p>
          </div>
        </div>
      `
  return poster
}
