'use client'

import { useMemo, useState } from 'react'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { updateRestaurant } from '@/app/actions/restaurant-actions'
import { brandPalette, contrast, hexToRgb } from '@/lib/brand-color'
import type { CoverStyle, MenuTheme } from '@/lib/menu'
import { cn } from '@/lib/utils'
import ImageTile from './image-tile'
import FontPicker from './font-picker'
import MenuPreview from './menu-preview'

export interface BrandingValues {
  name: string
  tagline: string
  cuisineType: string
  city: string
  currencySymbol: string
  logoUrl: string
  coverImageUrl: string
  coverImageStyle: CoverStyle
  colorTheme: string
  fontFamily: string
  googleFontUrl: string
  menuTheme: MenuTheme
}

type Editable = 'logoUrl' | 'coverImageUrl' | 'coverImageStyle' | 'colorTheme' | 'fontFamily' | 'googleFontUrl' | 'menuTheme'

interface BrandingPanelProps {
  restaurantId: string
  restaurantSlug: string
  values: BrandingValues
  /** `persisted` means the value is already saved (image uploads) and should not dirty the form. */
  onChange: (field: Editable, value: string, opts?: { persisted?: boolean }) => void
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

const APPEARANCE: { key: MenuTheme; label: string; hint: string; icon: typeof Sun }[] = [
  { key: 'system', label: 'Follow device', hint: 'Light or dark, whatever the guest’s phone uses. They can switch.', icon: Monitor },
  { key: 'light', label: 'Always light', hint: 'Paper background, no toggle.', icon: Sun },
  { key: 'dark', label: 'Always dark', hint: 'Best for dim rooms and dark photography.', icon: Moon },
]

const LIGHT_GROUND = hexToRgb('#FAFAF8')!
const DARK_GROUND = hexToRgb('#141311')!

export default function BrandingPanel({ restaurantId, restaurantSlug, values, onChange, disabled }: BrandingPanelProps) {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
  const shownTheme: 'light' | 'dark' = values.menuTheme === 'system' ? previewTheme : values.menuTheme

  const palette = useMemo(() => brandPalette(values.colorTheme || '#1F6B49'), [values.colorTheme])
  const ratioLight = useMemo(() => contrast(hexToRgb(palette.inkLight)!, LIGHT_GROUND), [palette])
  const ratioDark = useMemo(() => contrast(hexToRgb(palette.inkDark)!, DARK_GROUND), [palette])
  const adjusted = palette.raw.toLowerCase() !== palette.inkLight.toLowerCase()

  const persist = (field: 'logoUrl' | 'coverImageUrl') => async (url: string) => {
    await updateRestaurant(restaurantId, { [field]: url })
    onChange(field, url, { persisted: true })
  }

  const hex = values.colorTheme || '#1F6B49'
  const validHex = /^#[0-9a-f]{6}$/i.test(hex)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* Preview first on phones, sticky beside the controls on desks */}
      <aside className="flex flex-col items-center gap-3 lg:order-last lg:sticky lg:top-28 lg:self-start">
        <MenuPreview
          theme={shownTheme}
          values={{
            name: values.name,
            tagline: values.tagline,
            cuisineType: values.cuisineType,
            city: values.city,
            logoUrl: values.logoUrl,
            coverImageUrl: values.coverImageUrl,
            coverImageStyle: values.coverImageStyle,
            colorTheme: validHex ? hex : '#1F6B49',
            fontFamily: values.fontFamily,
            currencySymbol: values.currencySymbol || '€',
          }}
        />
        {values.menuTheme === 'system' ? (
          <div role="group" aria-label="Preview appearance" className="flex rounded-md border border-input bg-card p-0.5">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setPreviewTheme(t)}
                aria-pressed={previewTheme === t}
                className={cn(
                  'flex items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                  previewTheme === t ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t === 'light' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {t}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Guests always see the {values.menuTheme} version.</p>
        )}
        <p className="text-center text-xs text-muted-foreground">Live preview of the first screen guests see. Dishes are examples.</p>
      </aside>

      <div className="flex min-w-0 flex-col gap-8">
        {/* Identity */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Logo and cover</h2>
            <p className="text-sm text-muted-foreground">The logo sits on the cover photo; the name is always overlaid in white, so any photo works.</p>
          </div>
          <ImageTile
            kind="logo"
            label="Logo"
            value={values.logoUrl}
            restaurantSlug={restaurantSlug}
            onChange={(url) => onChange('logoUrl', url)}
            onPersist={persist('logoUrl')}
            disabled={disabled}
          />
          <ImageTile
            kind="cover"
            label="Cover photo"
            value={values.coverImageUrl}
            restaurantSlug={restaurantSlug}
            onChange={(url) => onChange('coverImageUrl', url)}
            onPersist={persist('coverImageUrl')}
            disabled={disabled}
          />
          {values.coverImageUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">Cover fit</span>
              <div role="group" aria-label="Cover fit" className="flex rounded-md border border-input bg-card p-0.5">
                {(
                  [
                    { key: 'cover', label: 'Fill' },
                    { key: 'repeat', label: 'Tile' },
                  ] as { key: CoverStyle; label: string }[]
                ).map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange('coverImageStyle', o.key)}
                    aria-pressed={values.coverImageStyle === o.key}
                    className={cn(
                      'rounded-[4px] px-3 py-1 text-xs font-medium transition-colors',
                      values.coverImageStyle === o.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Tile repeats a small pattern instead of stretching it.</span>
            </div>
          )}
        </section>

        {/* Colour */}
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
                  onClick={() => onChange('colorTheme', p.hex)}
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
                onChange={(e) => onChange('colorTheme', e.target.value)}
                className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={hex}
                disabled={disabled}
                onChange={(e) => onChange('colorTheme', e.target.value)}
                spellCheck={false}
                aria-label="Brand colour hex"
                className={cn('h-8 w-24 bg-transparent font-mono text-sm focus:outline-none', !validHex && 'text-destructive')}
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

        {/* Type */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">Typeface</h2>
            <p className="text-sm text-muted-foreground">One family for the whole menu. The default is tuned for small screens; the others give a stronger character.</p>
          </div>
          <FontPicker
            value={values.fontFamily}
            sample={values.name}
            disabled={disabled}
            onChange={(family, url) => {
              onChange('fontFamily', family)
              onChange('googleFontUrl', url)
            }}
          />
        </section>

        {/* Appearance */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">How the menu looks on a guest’s phone.</p>
          </div>
          <div role="radiogroup" aria-label="Menu appearance" className="grid gap-2 sm:grid-cols-3">
            {APPEARANCE.map((opt) => {
              const active = values.menuTheme === opt.key
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() => onChange('menuTheme', opt.key)}
                  className={cn(
                    'flex flex-col gap-1 rounded-md border px-3 py-2.5 text-left transition-colors',
                    active ? 'border-foreground bg-accent' : 'border-border bg-card hover:border-border-strong',
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <opt.icon className="h-4 w-4 text-muted-foreground" />
                    {opt.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{opt.hint}</span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
