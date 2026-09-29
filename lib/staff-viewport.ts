// lib/staff-viewport.ts
// The browser bar over a staff screen. The root layout's theme colour is a light/dark pair keyed
// on the device's colour scheme, which is right for the guest menu (it follows the device) and
// wrong for staff screens, which are light whatever the device prefers: on a dark phone the bar
// would be dark above a light page. A viewport is static — it cannot follow a choice made in the
// app — so the staff scope declares the light ground, its default.
import type { Viewport } from 'next'

/** The light theme's page ground (`--background` in app/globals.css), as the manifests use it. */
const LIGHT_GROUND = '#FAFAF8'

/** The staff scope's viewport: merged over the root's, it replaces only the theme colour. */
export const staffViewport: Viewport = { themeColor: LIGHT_GROUND }
