'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BRAND_FONTS, BRAND_FONTS_PREVIEW_URL, type FontCategory } from '@/lib/brand-fonts'

interface FontPickerProps {
  /** Currently stored family, or '' for the platform default */
  value: string
  onChange: (family: string, url: string) => void
  /** Text rendered in each option, typically the restaurant name */
  sample: string
  disabled?: boolean | undefined
}

const FILTERS: { key: FontCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sans', label: 'Sans' },
  { key: 'serif', label: 'Serif' },
  { key: 'display', label: 'Display' },
]

/**
 * Picks the menu's typeface from `BRAND_FONTS`, each option drawn in its own face with the
 * restaurant's name. Choosing the default reports an empty family and URL.
 */
export default function FontPicker({ value, onChange, sample, disabled }: FontPickerProps) {
  const [filter, setFilter] = useState<FontCategory | 'all'>('all')

  // Load every option once so the cards render in their own face.
  useEffect(() => {
    if (document.querySelector('link[data-brand-fonts-preview]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = BRAND_FONTS_PREVIEW_URL
    link.setAttribute('data-brand-fonts-preview', '')
    document.head.appendChild(link)
  }, [])

  const options = BRAND_FONTS.filter((f) => filter === 'all' || f.category === filter)
  const text = sample.trim() || 'Grilled chicken · €12.99'

  const card = (selected: boolean) =>
    cn(
      'flex flex-col gap-1 rounded-md border px-3 py-2.5 text-left transition-colors disabled:opacity-50',
      selected ? 'border-foreground bg-accent' : 'border-border bg-card hover:border-border-strong',
    )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Typeface</span>
        <div role="group" aria-label="Filter fonts" className="flex rounded-md border border-input bg-card p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                'rounded-[4px] px-2 text-xs font-medium transition-colors',
                filter === f.key ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {filter === 'all' && (
          <button type="button" disabled={disabled} onClick={() => onChange('', '')} className={card(!value)}>
            <span className="flex items-center justify-between text-xs text-muted-foreground">
              Default · Instrument Sans
              {!value && <Check className="h-3.5 w-3.5 text-foreground" />}
            </span>
            <span className="truncate text-lg font-semibold leading-tight">{text}</span>
          </button>
        )}
        {options.map((font) => {
          const selected = value.toLowerCase() === font.family.toLowerCase()
          return (
            <button
              key={font.family}
              type="button"
              disabled={disabled}
              onClick={() => onChange(font.family, font.url)}
              className={card(selected)}
              style={{ fontFamily: `"${font.family}", var(--font-sans), sans-serif` }}
            >
              <span className="flex items-center justify-between font-sans text-xs text-muted-foreground">
                {font.family} · {font.note}
                {selected && <Check className="h-3.5 w-3.5 text-foreground" />}
              </span>
              <span className="truncate text-lg font-semibold leading-tight">{text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
