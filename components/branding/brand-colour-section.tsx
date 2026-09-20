'use client'

import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { brandPalette } from '@/lib/brand-color'
import { contrast, hexToRgb } from '@/lib/color'
import { cn } from '@/lib/utils'

interface BrandColourSectionProps {
  /** The colour as typed, valid or not */
  hex: string
  validHex: boolean
  onChange: (hex: string) => void
  disabled?: boolean
}

const PRESETS: { hex: string; name: string }[] = [
  { hex: '#1F6B49', name: 'Basil' },
  { hex: '#2F6F73', name: 'Teal' },
  { hex: '#3F6B8A', name: 'Harbour' },
  { hex: '#5B3A8A', name: 'Plum' },
  { hex: '#8A2F2F', name: 'Burgundy' },
  { hex: '#B4412F', name: 'Terracotta' },
  { hex: '#B8860B', name: 'Saffron' },
  { hex: '#1B1A17', name: 'Ink' },
]

const LIGHT_GROUND = hexToRgb('#FAFAF8')!
const DARK_GROUND = hexToRgb('#141311')!

/** Presets, a custom colour, and how the brand ink reads on a light and a dark menu. */
export default function BrandColourSection({ hex, validHex, onChange, disabled }: BrandColourSectionProps) {
  const palette = useMemo(() => brandPalette(hex), [hex])
  const ratioLight = useMemo(() => contrast(hexToRgb(palette.inkLight)!, LIGHT_GROUND), [palette])
  const ratioDark = useMemo(() => contrast(hexToRgb(palette.inkDark)!, DARK_GROUND), [palette])
  const adjusted = palette.raw.toLowerCase() !== palette.inkLight.toLowerCase()

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Brand colour</h2>
        <p className="text-sm text-muted-foreground">
          Used for the AR button, the active filter and highlights. Foodify adjusts it automatically so text stays readable on both light and dark menus.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => {
          const active = hex.toLowerCase() === p.hex.toLowerCase()
          return (
            <button
              key={p.hex}
              type="button"
              disabled={disabled}
              title={p.name}
              aria-label={p.name}
              aria-pressed={active}
              onClick={() => onChange(p.hex)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow',
                active && 'ring-2 ring-foreground',
              )}
              style={{ backgroundColor: p.hex }}
            >
              {active && <Check className="h-3.5 w-3.5 text-white" />}
            </button>
          )
        })}
        <label className="ml-1 flex items-center gap-2 rounded-md border border-input bg-card pl-1 pr-2">
          <input
            type="color"
            aria-label="Custom brand colour"
            value={validHex ? hex : '#1F6B49'}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
          />
          <input
            type="text"
            value={hex}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            aria-label="Brand colour hex"
            className={cn('h-8 w-24 bg-transparent font-mono text-sm focus:outline-hidden', !validHex && 'text-destructive')}
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { label: 'On a light menu', ink: palette.inkLight, on: palette.onLight, ratio: ratioLight, bg: '#FAFAF8', fg: '#1B1A17', tint: palette.tintLight },
          { label: 'On a dark menu', ink: palette.inkDark, on: palette.onDark, ratio: ratioDark, bg: '#141311', fg: '#EFEDE6', tint: palette.tintDark },
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-2.5 rounded-md border border-border p-3" style={{ background: s.bg, color: s.fg }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-8 items-center whitespace-nowrap rounded-md px-3 text-xs font-semibold" style={{ background: s.ink, color: s.on }}>
                See it on your table
              </span>
              <span className="inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold" style={{ background: s.tint, color: s.ink }}>
                AR · 2
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] opacity-70">
              <span>{s.label}</span>
              <span className="tnum">{s.ratio.toFixed(1)}:1 contrast</span>
            </div>
          </div>
        ))}
      </div>
      {adjusted && validHex && (
        <p className="text-xs text-muted-foreground">
          {hex} is too light to carry text, so it is shown as {palette.inkLight} on light menus. Pick a deeper shade if you want it used as-is.
        </p>
      )}
    </section>
  )
}
