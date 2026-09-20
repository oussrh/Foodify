// lib/brand-color.ts
//
// Restaurants pick any colour. The customer pages never paint that raw colour under
// text; they use an "ink" (the same hue pushed to at least 4.5:1 against the page
// ground) and a "tint" (the raw colour at low alpha over the surface).

export type RGB = [number, number, number]
type HSL = [number, number, number]

const LIGHT_GROUND: RGB = [250, 250, 248] // Paper
const DARK_GROUND: RGB = [20, 19, 17] // Coal
const AA = 4.5

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
}

export function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex([r, g, b]: RGB): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => {
        const c = Math.max(0, Math.min(255, Math.round(v)))
        return (c < 16 ? '0' : '') + c.toString(16)
      })
      .join('')
  )
}

function rgbToHsl([r, g, b]: RGB): HSL {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h: number
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
  else if (max === g) h = (b - r) / d + 2
  else h = (r - g) / d + 4
  return [h / 6, s, l]
}

/** HSL with h, s, l in 0..1 to RGB 0..255; the design tokens in globals.css are checked through it. */
export function hslToRgb([h, s, l]: HSL): RGB {
  if (s === 0) return [l * 255, l * 255, l * 255]
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]
}

function luminance([r, g, b]: RGB): number {
  const lin = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a) + 0.05
  const lb = luminance(b) + 0.05
  return la > lb ? la / lb : lb / la
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

export function brandPalette(hex: string | null | undefined, fallback = '#1F6B49'): BrandPalette {
  const rgb = hexToRgb(hex || '') ?? (hexToRgb(fallback) as RGB)
  const inkLight = deriveInk(rgb, LIGHT_GROUND, true)
  const inkDark = deriveInk(rgb, DARK_GROUND, false)
  const [r, g, b] = rgb.map(Math.round)
  return {
    raw: rgbToHex(rgb),
    inkLight: rgbToHex(inkLight),
    inkDark: rgbToHex(inkDark),
    tintLight: `rgba(${r}, ${g}, ${b}, 0.14)`,
    tintDark: `rgba(${r}, ${g}, ${b}, 0.16)`,
    onLight: onColor(inkLight),
    onDark: onColor(inkDark),
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
