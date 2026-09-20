// components/model-viewer/element.ts
// The <model-viewer> custom element as the three viewers (AR page, 3D page, preview dialog)
// drive it: the script that defines it, the members they call, the AR page's two modes.

export const MODEL_VIEWER_SCRIPT_SRC = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'

// Define ModelViewer interface for better type safety
export interface ModelViewer extends HTMLElement {
  resetTurntableRotation(): void;
  jumpCameraToGoal(): void;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

export type ViewMode = '3d' | 'ar'

/** How AR opens on this device, once detected: WebXR, Android's Scene Viewer or iOS Quick Look. */
export type ArMode = 'webxr' | 'scene-viewer' | 'quick-look'
