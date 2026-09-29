// lib/staff-mark.ts
// The Foodizar mark as data, drawn twice from the same numbers: as PNG icons and startup images by
// scripts/icons/staff-icons.mjs (which imports this file as it is, so it has no runtime imports),
// and as inline SVG on the in-app launch screen and the install invitation
// (components/staff/staff-mark.tsx). A geometric "F" built from three bars, with a round badge at
// its lower right that says which app it is: W for the waiter, K for the kitchen, a ticket's lines
// for a portal's board. Everything is in a 512 box and sits inside its central 80 % once scaled by
// 0.8, which is what a maskable icon needs.
import type { StaffBrandApp } from './staff-apps'

/** One bar of the F, in the 512 box. */
interface Bar {
  x: number
  y: number
  width: number
  height: number
}

/**
 * The mark: the F's bars and their corner radius; the badge (a white disc with a ground-coloured
 * ring that parts it from the F); and each app's glyph, a stroked path in the ground colour.
 */
export const STAFF_MARK = {
  box: 512,
  radius: 14,
  bars: [
    { x: 112, y: 96, width: 72, height: 288 },
    { x: 112, y: 96, width: 208, height: 72 },
    { x: 112, y: 206, width: 136, height: 64 },
  ] satisfies Bar[],
  badge: { cx: 318, cy: 338, r: 86, ring: 14 },
  glyphStroke: 18,
  glyphs: {
    waiter: 'M274 308 L296 372 L318 332 L340 372 L362 308',
    kitchen: 'M292 296 V380 M346 296 L302 340 M314 328 L348 380',
    orders: 'M284 314 H352 M284 338 H352 M284 362 H330',
  } satisfies Record<StaffBrandApp, string>,
} as const
