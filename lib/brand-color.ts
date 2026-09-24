// lib/brand-color.ts
//
// Restaurants pick any colour. The customer pages never paint that raw colour under
// text; they use an "ink" (the same hue pushed to at least 4.5:1 against the tint surface,
// the ground with the raw colour at low alpha over it, which is the least contrasting thing
// the ink is written on: the AR chip is ink on tint) and that "tint".

import { contrast, hexToRgb, hslToRgb, rgbToHex, rgbToHsl, type RGB } from './color'

const LIGHT_GROUND: RGB = [250, 250, 248] // Paper
const DARK_GROUND: RGB = [20, 19, 17] // Coal
const TINT_ALPHA_LIGHT = 0.14
const TINT_ALPHA_DARK = 0.16
const AA = 4.5

/** The ground with the raw colour at `alpha` over it: what the tint looks like, as an opaque colour the contrast can be read against. */
function tintSurface(rgb: RGB, ground: RGB, alpha: number): RGB {
  return [0, 1, 2].map((i) => Math.round(ground[i]! * (1 - alpha) + rgb[i]! * alpha)) as RGB
}

/** What `brandPalette` derives from one stored colour: the raw hex plus, per theme, an ink that reads at AA on that ground, a tint, and the text colour to put on the ink. */
export interface BrandPalette {
  /** The colour as stored, normalized to #rrggbb */
  raw: string
  inkLight: string
  inkDark: string
  tintLight: string
  tintDark: string
  /** Text colour to use on top of the ink */
  onLight: string
  onDark: string
  /** The stored inks' contrast against the bare menu grounds (Paper and Coal), as the Branding tab reports it */
  ratioLight: number
  ratioDark: number
}

/** Push lightness away from the ground until the hue reaches AA; cap saturation so neons calm down. */
function deriveInk(rgb: RGB, ground: RGB, darker: boolean): RGB {
  const hsl = rgbToHsl(rgb)
  // Light inks may stay vivid; on a dark ground a saturated light colour glares.
  hsl[1] = Math.min(hsl[1], darker ? 0.85 : 0.7)
  let out = hslToRgb(hsl)
  let guard = 0
  while (contrast(out, ground) < AA && guard++ < 200) {
    hsl[2] += darker ? -0.01 : 0.01
    if (hsl[2] <= 0.02 || hsl[2] >= 0.98) break
    out = hslToRgb(hsl)
  }
  return out
}

const WHITE: RGB = [255, 255, 255]
const NEAR_BLACK: RGB = [20, 19, 17]

/** Text colour for content placed on top of an ink: white or near-black, whichever reads better. */
function onColor(ink: RGB): string {
  return contrast(ink, WHITE) >= contrast(ink, NEAR_BLACK) ? '#ffffff' : '#141311'
}

/**
 * The palette for a stored colour; an empty or unparseable value takes the fallback (Basil, the
 * accent), so a bad row still renders on-brand. Pure, so the branding preview, the page and the
 * manifest agree on the same hex.
 */
export function brandPalette(hex: string | null | undefined, fallback = '#1F6B49'): BrandPalette {
  const rgb = hexToRgb(hex || '') ?? (hexToRgb(fallback) as RGB)
  const inkLight = deriveInk(rgb, tintSurface(rgb, LIGHT_GROUND, TINT_ALPHA_LIGHT), true)
  const inkDark = deriveInk(rgb, tintSurface(rgb, DARK_GROUND, TINT_ALPHA_DARK), false)
  const [r, g, b] = rgb.map(Math.round)
  // Read on the rounded ink, the one stored and painted, not the unrounded one derived.
  const stored = (ink: RGB) => ink.map((v) => Math.max(0, Math.min(255, Math.round(v)))) as RGB
  return {
    raw: rgbToHex(rgb),
    inkLight: rgbToHex(inkLight),
    inkDark: rgbToHex(inkDark),
    tintLight: `rgba(${r}, ${g}, ${b}, ${TINT_ALPHA_LIGHT})`,
    tintDark: `rgba(${r}, ${g}, ${b}, ${TINT_ALPHA_DARK})`,
    onLight: onColor(inkLight),
    onDark: onColor(inkDark),
    ratioLight: contrast(stored(inkLight), LIGHT_GROUND),
    ratioDark: contrast(stored(inkDark), DARK_GROUND),
  }
}

/**
 * Inline CSS variables for a `.brand-scope` element. globals.css maps these to
 * --brand-ink / --brand-tint / --brand-on for the active theme.
 */
export function brandStyle(hex: string | null | undefined): Record<string, string> {
  const p = brandPalette(hex)
  return {
    '--brand-raw': p.raw,
    '--brand-ink-light': p.inkLight,
    '--brand-ink-dark': p.inkDark,
    '--brand-tint-light': p.tintLight,
    '--brand-tint-dark': p.tintDark,
    '--brand-on-light': p.onLight,
    '--brand-on-dark': p.onDark,
  }
}
