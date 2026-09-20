import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrast, hslToRgb, type RGB } from '@/lib/brand-color'

// The design tokens (app/globals.css) are HSL channels: "153 55% 27%". Every text-on-surface pair
// the UI paints must read at WCAG AA in both themes (A11Y-CONTRAST): 4.5:1 for text, 3:1 for the
// large text and UI parts. Computed from the token file, so a colour change that breaks a pair
// fails here before it ships.
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')

function tokens(selector: string): Record<string, RGB> {
  const block = css.slice(css.indexOf(selector))
  const body = block.slice(block.indexOf('{') + 1, block.indexOf('}'))
  const out: Record<string, RGB> = {}
  for (const m of body.matchAll(/--([a-z-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*;/g)) {
    out[m[1]] = hslToRgb([Number(m[2]) / 360, Number(m[3]) / 100, Number(m[4]) / 100])
  }
  return out
}

const themes = { light: tokens('.light {'), dark: tokens('.dark {') }

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
]
/**
 * Non-text UI against the surface it sits on (WCAG 1.4.11 asks 3:1 for a control's boundary).
 * The focus ring meets it. The input border does not yet: pinned at its measured 1.4 (light) so it
 * cannot fall further, to be raised to 3 when the token moves (docs/ADOPTION_DECISIONS.md, phase 3).
 */
const UI_PAIRS: [string, string, number][] = [
  ['ring', 'background', 3],
  ['input', 'background', 1.4],
]

describe.each(Object.entries(themes))('%s theme tokens', (name, t) => {
  it('parsed every colour token', () => {
    expect(Object.keys(t).length).toBeGreaterThanOrEqual(20)
  })

  it.each(TEXT_PAIRS)('%s on %s reads at least %s:1', (text, surface, min) => {
    expect(contrast(t[text], t[surface])).toBeGreaterThanOrEqual(min)
  })

  it.each(UI_PAIRS)('%s against %s reads at least %s:1', (part, surface, min) => {
    expect(contrast(t[part], t[surface])).toBeGreaterThanOrEqual(min)
  })
})
