'use client'

import { updateRestaurant } from '@/app/actions/restaurant-actions'
import type { CoverStyle, MenuTheme } from '@/lib/menu'
import { cn } from '@/lib/utils'
import ImageTile from './image-tile'
import FontPicker from './font-picker'
import PreviewAside from './preview-aside'
import BrandColourSection from './brand-colour-section'
import AppearanceSection from './appearance-section'

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

const COVER_FITS: { key: CoverStyle; label: string }[] = [
  { key: 'cover', label: 'Fill' },
  { key: 'repeat', label: 'Tile' },
]

export default function BrandingPanel({ restaurantId, restaurantSlug, values, onChange, disabled }: BrandingPanelProps) {
  const persist = (field: 'logoUrl' | 'coverImageUrl') => async (url: string) => {
    await updateRestaurant(restaurantId, { [field]: url })
    onChange(field, url, { persisted: true })
  }

  const hex = values.colorTheme || '#1F6B49'
  const validHex = /^#[0-9a-f]{6}$/i.test(hex)

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      {/* Preview first on phones, sticky beside the controls on desks */}
      <PreviewAside
        menuTheme={values.menuTheme}
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
                {COVER_FITS.map((o) => (
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
        <BrandColourSection hex={hex} validHex={validHex} onChange={(next) => onChange('colorTheme', next)} disabled={disabled} />

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
        <AppearanceSection value={values.menuTheme} onChange={(theme) => onChange('menuTheme', theme)} disabled={disabled} />
      </div>
    </div>
  )
}
