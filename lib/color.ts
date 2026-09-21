// lib/color.ts
// Colour arithmetic with no opinion about the brand: hex, HSL and RGB conversions, relative
// luminance and the WCAG contrast ratio. The brand palette (lib/brand-color.ts) and the token
// contrast test (test/contrast.test.ts) are built on it.

export type RGB = [number, number, number]
export type HSL = [number, number, number]



export function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.replace(/./g, (c) => c + c)
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbToHex([r, g, b]: RGB): string {
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

export function rgbToHsl([r, g, b]: RGB): HSL {
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

/** HSL with h, s, l in 0..1 to RGB 0..255. */
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

/** The linear value of one sRGB channel. */
function linear(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function luminance([r, g, b]: RGB): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

export function contrast(a: RGB, b: RGB): number {
  const la = luminance(a) + 0.05
  const lb = luminance(b) + 0.05
  return la > lb ? la / lb : lb / la
}

