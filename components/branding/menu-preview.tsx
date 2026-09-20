'use client'

import Image from 'next/image'
import type { CSSProperties } from 'react'
import { Camera, Moon, Search, SlidersHorizontal, Utensils } from 'lucide-react'
import { brandStyle } from '@/lib/brand-color'
import { cn } from '@/lib/utils'

export interface MenuPreviewValues {
  name: string
  tagline: string
  cuisineType?: string
  city?: string
  logoUrl: string
  coverImageUrl: string
  coverImageStyle: 'cover' | 'repeat'
  colorTheme: string
  fontFamily: string
  currencySymbol: string
}

interface MenuPreviewProps {
  values: MenuPreviewValues
  theme: 'light' | 'dark'
  className?: string
}

const ROWS = [
  { name: 'Grilled chicken', desc: 'Chermoula, preserved lemon', price: 12.99, ar: true, hue: 36 },
  { name: 'Lamb tagine', desc: 'Prunes, toasted almonds', price: 16.5, ar: true, hue: 20 },
  { name: 'Zaalouk', desc: 'Smoked aubergine, cumin', price: 4.5, ar: false, hue: 82 },
]

/** A faithful, static replica of the public menu's first screen, driven by the form values. */
export default function MenuPreview({ values, theme, className }: MenuPreviewProps) {
  const style: CSSProperties = {
    ...(brandStyle(values.colorTheme) as CSSProperties),
    ...(values.fontFamily ? { fontFamily: `"${values.fontFamily}", var(--font-sans), sans-serif` } : {}),
  }
  const meta = [values.cuisineType, values.city].filter(Boolean).join(' · ')

  return (
    <div className={cn('mx-auto w-[300px] rounded-[34px] bg-[#111] p-2 shadow-sheet', className)} aria-label="Menu preview">
      <div
        className={cn('brand-scope relative flex h-[560px] flex-col overflow-hidden rounded-[28px] bg-background text-foreground', theme)}
        style={style}
      >
        {/* hero */}
        <div className="relative h-[132px] shrink-0 overflow-hidden bg-muted">
          {values.coverImageUrl && values.coverImageStyle === 'repeat' ? (
            <div className="absolute inset-0" style={{ backgroundImage: `url(${values.coverImageUrl})`, backgroundRepeat: 'repeat', backgroundSize: 'auto' }} />
          ) : values.coverImageUrl ? (
            <Image src={values.coverImageUrl} alt="" fill unoptimized sizes="300px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-brand-tint" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-3 pb-3">
            {values.logoUrl ? (
              <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-md bg-white">
                <Image src={values.logoUrl} alt="" fill unoptimized sizes="36px" className="object-cover" />
              </span>
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/90 text-[#1B1A17]">
                <Utensils className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0 text-white">
              <p className="truncate text-[17px] font-semibold leading-tight tracking-display">{values.name || 'Your restaurant'}</p>
              {(values.tagline || meta) && <p className="truncate text-[11px] text-white/85">{values.tagline || meta}</p>}
            </div>
          </div>
        </div>

        {/* bar */}
        <div className="flex shrink-0 items-center gap-1.5 border-b border-border px-3 py-2">
          <span className="flex h-8 flex-1 items-center gap-1.5 rounded-md border border-input bg-card px-2 text-[11px] text-muted-foreground">
            <Search className="h-3 w-3" /> Search menu
          </span>
          <span className="flex h-8 items-center rounded-md border border-input bg-card p-0.5 text-[10px] font-semibold">
            <span className="rounded-[3px] bg-foreground px-1.5 leading-6 text-background">EN</span>
            <span className="px-1.5 text-muted-foreground">FR</span>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-card">
            <SlidersHorizontal className="h-3 w-3" />
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-card">
            <Moon className="h-3 w-3" />
          </span>
        </div>

        {/* chips */}
        <div className="flex shrink-0 gap-1 overflow-hidden border-b border-border px-3 py-2">
          {['Starters', 'Mains', 'Drinks'].map((c, i) => (
            <span
              key={c}
              className={cn(
                'h-7 shrink-0 rounded-full border px-2.5 text-[11px] font-medium leading-[26px]',
                i === 0 ? 'border-foreground bg-foreground text-background' : 'border-border-strong bg-card',
              )}
            >
              {c}
            </span>
          ))}
          <span className="ml-auto inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-brand-tint px-2.5 text-[11px] font-semibold text-brand">
            <Camera className="h-3 w-3" /> AR · 2
          </span>
        </div>

        {/* rows */}
        <div className="flex-1 overflow-hidden px-3">
          <div className="flex items-baseline justify-between pb-1 pt-3">
            <span className="text-[15px] font-semibold tracking-display">Starters</span>
            <span className="text-[10px] text-muted-foreground">3 dishes</span>
          </div>
          {ROWS.map((r) => (
            <div key={r.name} className="grid grid-cols-[56px_1fr_auto] items-center gap-2.5 border-b border-border py-2">
              <span
                className="relative block h-14 w-14 overflow-hidden rounded-md"
                style={{ background: `radial-gradient(circle at 34% 30%, hsl(${r.hue} 62% 80%), hsl(${r.hue} 48% 62%) 40%, hsl(${r.hue} 36% 38%))` }}
              >
                {r.ar && <span className="absolute bottom-1 left-1 rounded-full bg-white/92 px-1 text-[8px] font-bold text-[#1B1A17]">AR</span>}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold leading-snug">{r.name}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{r.desc}</span>
              </span>
              <span className="tnum self-start text-[13px] font-semibold">
                {values.currencySymbol}
                {r.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* AR action, as it appears on a dish */}
        <div className="shrink-0 border-t border-border bg-card px-3 py-2.5">
          <span className="flex h-9 items-center justify-center gap-1.5 rounded-md bg-brand text-[12px] font-semibold text-brand-on">
            <Camera className="h-3.5 w-3.5" /> See it on your table
          </span>
        </div>
      </div>
    </div>
  )
}
