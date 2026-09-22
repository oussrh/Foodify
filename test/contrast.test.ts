import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrast, hslToRgb, type RGB } from '@/lib/color'

// The design tokens (app/globals.css) are HSL channels: "153 55% 27%". Every text-on-surface pair
// the UI paints must read at WCAG AA in both themes (A11Y-CONTRAST): 4.5:1 for text, 3:1 for the
// large text and UI parts. Computed from the token file, so a colour change that breaks a pair
// fails here before it ships.
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')

function tokens(selector: string): Record<string, RGB> {
  const block = css.slice(css.indexOf(selector))
  const body = block.slice(block.indexOf('{') + 1, block.indexOf('}'))
  const out: Record<string, RGB> = {}
  for (const [, name, h, s, l] of body.matchAll(/--([a-z-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*;/g)) {
    if (name && h && s && l) out[name] = hslToRgb([Number(h) / 360, Number(s) / 100, Number(l) / 100])
  }
  return out
}

/** The token's colour, or a failure naming the token the theme lacks. */
function rgb(theme: Record<string, RGB>, name: string): RGB {
  const value = theme[name]
  if (!value) throw new Error(`no token --${name} in this theme`)
  return value
}

/** [text, surface, minimum] */
const TEXT_PAIRS: [string, string, number][] = [
  ['foreground', 'background', 4.5],
  ['muted-foreground', 'background', 4.5],
  ['card-foreground', 'card', 4.5],
  ['muted-foreground', 'card', 4.5],
  ['popover-foreground', 'popover', 4.5],
  ['primary-foreground', 'primary', 4.5],
  ['secondary-foreground', 'secondary', 4.5],
  ['accent-foreground', 'accent', 4.5],
  ['destructive-foreground', 'destructive', 4.5],
  ['primary', 'background', 4.5],
  ['success', 'background', 4.5],
  ['warning', 'background', 4.5],
  ['destructive', 'background', 4.5],
  // painted on the muted surface too: badges, hints and the status colours in tables and dialogs
  ['muted-foreground', 'muted', 4.5],
  ['primary', 'muted', 4.5],
  ['success', 'muted', 4.5],
  ['warning', 'muted', 4.5],
  ['destructive', 'muted', 4.5],
]
/**
 * A badge writes its accent on a 12% wash of itself (`bg-warning/12 text-warning`). The browser
 * mixes that with whatever is under it, so comparing the two tokens says nothing about what a
 * reader sees: the wash has to be composited first, over each surface a badge sits on. Not doing
 * so is how the warning badge shipped at 3.95:1 on a muted surface with every token pair green;
 * the browser suite's axe scan caught it, which is the job this table now does earlier.
 */
const TINT = 0.12
/** [accent, surface, minimum] — the accent as ink, over its own tint composited on the surface. */
const TINT_PAIRS: [string, string, number][] = [
  ['success', 'card', 4.5],
  ['success', 'muted', 4.5],
  ['warning', 'card', 4.5],
  ['warning', 'muted', 4.5],
]

/** `fg` at `alpha` over `bg`: what a browser paints for a translucent fill. */
function composite(fg: RGB, bg: RGB, alpha: number): RGB {
  return [0, 1, 2].map((i) => Math.round(fg[i]! * alpha + bg[i]! * (1 - alpha))) as RGB
}

/**
 * Non-text UI against the surface it sits on (WCAG 1.4.11 asks 3:1 for a control's boundary).
 * The focus ring meets it. The input border does not yet: pinned at what it measures (1.46 in the
 * light theme, 1.60 in the dark) so it cannot fall further, to be raised to 3 when the token moves
 * (docs/ADOPTION_DECISIONS.md, phase 3).
 */
const THEMES: { name: string; t: Record<string, RGB>; uiPairs: [string, string, number][] }[] = [
  { name: 'light', t: tokens('.light {'), uiPairs: [['ring', 'background', 3], ['input', 'background', 1.46]] },
  { name: 'dark', t: tokens('.dark {'), uiPairs: [['ring', 'background', 3], ['input', 'background', 1.6]] },
]

describe.each(THEMES)('$name theme tokens', ({ t, uiPairs }) => {
  it('parsed every colour token', () => {
    expect(Object.keys(t).length).toBeGreaterThanOrEqual(20)
  })

  it.each(TEXT_PAIRS)('%s on %s reads at least %s:1', (text, surface, min) => {
    expect(contrast(rgb(t, text), rgb(t, surface))).toBeGreaterThanOrEqual(min)
  })

  it.each(uiPairs)('%s against %s reads at least %s:1', (part, surface, min) => {
    expect(contrast(rgb(t, part), rgb(t, surface))).toBeGreaterThanOrEqual(min)
  })

  it.each(TINT_PAIRS)('%s on its own tint over %s reads at least %s:1', (accent, surface, min) => {
    const ink = rgb(t, accent)
    expect(contrast(ink, composite(ink, rgb(t, surface), TINT))).toBeGreaterThanOrEqual(min)
  })
})
