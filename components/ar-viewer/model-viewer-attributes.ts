// components/ar-viewer/model-viewer-attributes.ts
// How the AR viewer configures its <model-viewer>: the attributes every mode gets, then the
// 3D set (turntable, indoor lighting, a camera that never looks under the dish) or the AR set
// (the AR launch modes, real-world lighting, the platform's own tweaks). Order matters: an
// attribute set twice keeps its last value.
import type { ArMode } from '@/components/model-viewer/element'

/**
 * Sets the attributes every mode shares: the model source, its alt text, camera controls, loading
 * and the default shadows and tone mapping. Call it first: the 3D or AR set applied after it
 * overrides what they both set.
 */
export function applyBaseAttributes(modelViewer: HTMLElement, modelUrl: string, dishName: string) {
  modelViewer.setAttribute('src', modelUrl)
  modelViewer.setAttribute('alt', `3D model of ${dishName}`)
  modelViewer.setAttribute('camera-controls', '')
  modelViewer.setAttribute('touch-action', 'pan-y')
  modelViewer.setAttribute('loading', 'eager')
  modelViewer.setAttribute('reveal', 'auto')
  modelViewer.setAttribute('shadow-intensity', '1')
  modelViewer.setAttribute('shadow-softness', '0.5')
  modelViewer.setAttribute('exposure', '1')
  modelViewer.setAttribute('tone-mapping', 'aces')
}

/** 3D Mode - No AR, better for desktop viewing with enhanced lighting */
export function apply3dAttributes(modelViewer: HTMLElement) {
  modelViewer.setAttribute('auto-rotate', '')
  modelViewer.setAttribute('auto-rotate-delay', '1000')
  modelViewer.setAttribute('rotation-per-second', '20deg')

  // Enhanced lighting configuration for 3D mode to prevent black models
  modelViewer.setAttribute('environment-image', 'https://modelviewer.dev/shared-assets/environments/moon_1k.hdr')
  modelViewer.setAttribute('skybox-height', '2m')
  modelViewer.setAttribute('exposure', '1.2')
  modelViewer.setAttribute('shadow-intensity', '0.8')
  modelViewer.setAttribute('shadow-softness', '0.6')

  // Enhanced tone mapping for better color rendering
  modelViewer.setAttribute('tone-mapping', 'commerce')

  // Camera constraints - prevent seeing bottom of dish
  modelViewer.setAttribute('min-camera-orbit', 'auto 0deg auto')
  modelViewer.setAttribute('max-camera-orbit', 'auto 180deg auto')
  modelViewer.setAttribute('camera-orbit', '45deg 75deg auto')

  // Remove AR attributes
  modelViewer.removeAttribute('ar')
  modelViewer.removeAttribute('ar-modes')
}

/** AR Mode - Enhanced camera configuration for mobile AR experience with optimizations */
export function applyArAttributes(modelViewer: HTMLElement, modelUrl: string, arMode: ArMode | null) {
  modelViewer.setAttribute('ar', '')
  modelViewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look')
  modelViewer.setAttribute('ar-scale', 'auto')
  modelViewer.setAttribute('ar-placement', 'floor')

  // Show the model as soon as it loads so users get a preview behind the AR button
  modelViewer.setAttribute('loading', 'eager')
  modelViewer.setAttribute('reveal', 'auto')

  // Use estimated real-world lighting from the camera feed in WebXR sessions
  modelViewer.setAttribute('xr-environment', '')

  // Enhanced AR camera settings for better mobile experience
  modelViewer.setAttribute('camera-controls', 'enable-pan')
  modelViewer.setAttribute('disable-pan', 'false')
  modelViewer.setAttribute('disable-zoom', 'false')
  modelViewer.setAttribute('interaction-policy', 'always-allow')
  modelViewer.setAttribute('touch-action', 'manipulation')

  // Improved lighting and rendering for AR with better visibility
  modelViewer.setAttribute('environment-image', 'https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr')
  modelViewer.setAttribute('skybox-image', 'null')
  modelViewer.setAttribute('exposure', '1.3')
  modelViewer.setAttribute('shadow-intensity', '0.9')
  modelViewer.setAttribute('shadow-softness', '0.7')
  modelViewer.setAttribute('tone-mapping', 'commerce')

  // Better camera orbit constraints for AR
  modelViewer.setAttribute('min-camera-orbit', 'auto 0deg auto')
  modelViewer.setAttribute('max-camera-orbit', 'auto 180deg auto')
  modelViewer.setAttribute('min-field-of-view', '25deg')
  modelViewer.setAttribute('max-field-of-view', '45deg')

  // Remove auto-rotate for AR mode
  modelViewer.removeAttribute('auto-rotate')

  // Platform-specific optimizations
  if (/iPhone|iPad/.test(navigator.userAgent)) {
    // iOS AR Quick Look optimizations
    const usdzUrl = modelUrl.replace('.glb', '.usdz')
    modelViewer.setAttribute('ios-src', usdzUrl)
    modelViewer.setAttribute('quick-look-browsers', 'safari chrome')
  } else if (/Android/.test(navigator.userAgent)) {
    // Android Scene Viewer optimizations
    modelViewer.setAttribute('ar-modes', 'scene-viewer webxr')
    modelViewer.setAttribute('ar', '')
  }

  // Add camera access logging for debugging
  console.log('AR mode configured for:', arMode, 'Device:', navigator.userAgent.includes('iPhone') ? 'iOS' : navigator.userAgent.includes('Android') ? 'Android' : 'Desktop')
}
