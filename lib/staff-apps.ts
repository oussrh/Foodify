// lib/staff-apps.ts
// What the installed staff apps are called and how they look, in one place: the brand (Foodizar,
// the staff apps' own name; the guest menu and the portals stay Foodify), each app's name on a
// home screen, the line under it on the launch screen, its colours, its icon files and the iOS
// startup images. The manifest route, the pages' metadata, the in-app launch screen and the
// install invitation all read it, and so does the script that draws the icons
// (scripts/icons/staff-icons.mjs), which imports this file as it is: hence no runtime imports and
// nothing Node cannot strip the types from.
import type { STAFF_APPS } from './schemas/staff-app'

type StaffPortal = (typeof STAFF_APPS)[number]

/** The brand the staff apps carry: Basil ground, white mark and white text. */
export const STAFF_BRAND = { name: 'Foodizar', color: '#1F6B49', ink: '#FFFFFF' } as const

/** The three installed staff apps: the waiter's phone, the kitchen tablet, and a portal's board. */
export type StaffBrandApp = 'waiter' | 'kitchen' | 'orders'

/** The screens an app is used on, which decides the iOS startup images drawn for it. */
type ScreenKind = 'phone' | 'tablet'

interface StaffAppIdentity {
  /** The installed app's full name: "Foodizar Waiter". */
  name: string
  /** The name under the home-screen icon, where there is room for one word. */
  shortName: string
  /** The line under "Foodizar" on the launch screen. */
  subtitle: string
  /** The manifest's description for one restaurant. */
  about: (restaurant: string) => string
  /** The description when the address names no restaurant. */
  generic: string
  screens: ScreenKind
}

/** Each app's names and description, read by the manifest, the metadata and the launch screen. */
export const STAFF_APP_IDENTITY: Record<StaffBrandApp, StaffAppIdentity> = {
  waiter: {
    name: `${STAFF_BRAND.name} Waiter`,
    shortName: 'Waiter',
    subtitle: 'Waiter App',
    about: (restaurant) => `Taking orders at the table in ${restaurant}, and what is ready to carry out.`,
    generic: 'Taking orders at the table, and what is ready to carry out.',
    screens: 'phone',
  },
  kitchen: {
    name: `${STAFF_BRAND.name} Kitchen`,
    shortName: 'Kitchen',
    subtitle: 'Kitchen App',
    about: (restaurant) => `The kitchen board for ${restaurant}: new orders as they arrive, and what has run out.`,
    generic: 'The kitchen board: new orders as they arrive, and what has run out.',
    screens: 'tablet',
  },
  orders: {
    name: `${STAFF_BRAND.name} Orders`,
    shortName: 'Orders',
    subtitle: 'Orders App',
    about: (restaurant) => `The kitchen board for ${restaurant}: new orders as they arrive.`,
    generic: 'The kitchen board: new orders as they arrive.',
    screens: 'tablet',
  },
}

/** Which branded app a staff portal installs as: the admin's and the manager's boards are both "Orders". */
export function staffBrandApp(portal: StaffPortal): StaffBrandApp {
  return portal === 'admin' || portal === 'manager' ? 'orders' : portal
}

/** The installed app's name: "Foodizar Kitchen · Chez Nous", or the app's own name when no restaurant is known. */
export function staffAppName(app: StaffBrandApp, restaurant: string | null): string {
  const { name } = STAFF_APP_IDENTITY[app]
  return restaurant ? `${name} · ${restaurant}` : name
}

/** The drawn sizes of each app's icon: square 192 and 512, the maskable 512, and the iPhone's 180. */
export type StaffIconVariant = '192' | '512' | 'maskable-512' | 'apple-180'

/** Where an app's icon of one variant is served from (drawn by scripts/icons/staff-icons.mjs). */
export function staffIconPath(app: StaffBrandApp, variant: StaffIconVariant): string {
  return `/icons/staff/${app}-${variant}.png`
}

/** One screen an iOS startup image is drawn for: CSS pixels in portrait, and the pixel ratio. */
interface StartupScreen {
  width: number
  height: number
  ratio: number
}

/**
 * The screens iOS is given a startup image for. It shows one only on an exact match, so these are
 * the devices in service today. Phones, portrait (a waiter holds the phone upright): iPhone SE 2/3
 * and 8; 12, 13, 14; 14 Pro, 15, 15 Pro, 16; 16 Pro, 17, 17 Pro; 14 Pro Max, 15 Plus / Pro Max,
 * 16 Plus; 16 Pro Max, 17 Pro Max. Tablets, both ways up (a tablet stands in a dock either way):
 * iPad 10.2" (7th to 9th generation); iPad 10th generation and iPad Air 10.9"; iPad Pro 11" (to M2)
 * and Air 11"; iPad Pro 11" (M4); iPad Pro 12.9" and Air 13"; iPad Pro 13" (M4). Any other device shows a plain screen for a moment and then the
 * app's own launch screen.
 */
export const STARTUP_SCREENS: Record<ScreenKind, StartupScreen[]> = {
  phone: [
    { width: 375, height: 667, ratio: 2 },
    { width: 390, height: 844, ratio: 3 },
    { width: 393, height: 852, ratio: 3 },
    { width: 402, height: 874, ratio: 3 },
    { width: 430, height: 932, ratio: 3 },
    { width: 440, height: 956, ratio: 3 },
  ],
  tablet: [
    { width: 810, height: 1080, ratio: 2 },
    { width: 820, height: 1180, ratio: 2 },
    { width: 834, height: 1194, ratio: 2 },
    { width: 834, height: 1210, ratio: 2 },
    { width: 1024, height: 1366, ratio: 2 },
    { width: 1032, height: 1376, ratio: 2 },
  ],
}

/** One startup image to draw and to link: its file, its size in device pixels, and the media query that picks it. */
export interface StartupImage {
  url: string
  media: string
  width: number
  height: number
}

/**
 * The startup images an app links, each with the media query iOS matches it by: portrait for a
 * phone, portrait and landscape for a tablet. `device-width` and `device-height` are the portrait
 * values whichever way the device is held; the image itself is drawn the way it is held.
 */
export function startupImages(app: StaffBrandApp): StartupImage[] {
  const { screens } = STAFF_APP_IDENTITY[app]
  const orientations = screens === 'phone' ? (['portrait'] as const) : (['portrait', 'landscape'] as const)
  return STARTUP_SCREENS[screens].flatMap(({ width, height, ratio }) =>
    orientations.map((orientation) => {
      const [w, h] = orientation === 'portrait' ? [width * ratio, height * ratio] : [height * ratio, width * ratio]
      return {
        url: `/icons/staff/splash/${app}-${w}x${h}.png`,
        media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation})`,
        width: w,
        height: h,
      }
    }),
  )
}
