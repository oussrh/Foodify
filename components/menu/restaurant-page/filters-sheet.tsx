"use client"

import type { CSSProperties } from 'react'
import { Camera, Check, Download } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { offeredDietary, type Locale } from '@/lib/menu'
import { MENU_TEXT } from '@/lib/menu-text'
import type { InstallPlatform } from '../use-pwa'
import type { MenuFilters } from './use-menu-filters'

interface FiltersSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: MenuFilters
  /** The restaurant's dietary options: the only chips offered; none, and the group is not shown. */
  dietaryOptions: readonly string[]
  locale: Locale
  /** '' when the menu follows the device; the forced theme's class otherwise */
  themeClass: string
  brandStyle: Record<string, string>
  installPlatform: InstallPlatform
  onInstall: () => void
  offlineReady: boolean
}

/** The filters sheet: AR only, dietary chips, then the install offer and the offline note. */
export default function FiltersSheet({ open, onOpenChange, filters, dietaryOptions, locale, themeClass, brandStyle, installPlatform, onInstall, offlineReady }: FiltersSheetProps) {
  const t = MENU_TEXT[locale]
  const { arCount, arOnly, setArOnly, dietary, setDietary } = filters
  const offered = offeredDietary(dietaryOptions)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn('mx-auto w-full max-w-lg p-0 sm:rounded-t-sheet', themeClass)} style={brandStyle as CSSProperties}>
        <div lang={locale} className="brand-scope flex flex-col gap-5 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <div className="mx-auto h-1 w-10 rounded-full bg-border-strong" aria-hidden="true" />
          <SheetTitle className="text-lg font-semibold tracking-display">{t.filters}</SheetTitle>
          <SheetDescription className="sr-only">{t.dietary}</SheetDescription>

          {arCount > 0 && (
            <label className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-brand" aria-hidden="true" />
                {t.arOnly}
              </span>
              <Switch checked={arOnly} onCheckedChange={setArOnly} />
            </label>
          )}

          {offered.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t.dietary}</span>
            <div className="flex flex-wrap gap-1.5">
              {offered.map((opt) => {
                const on = dietary.includes(opt.key)
                return (
                  <button
                    key={opt.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDietary((d) => (on ? d.filter((k) => k !== opt.key) : [...d, opt.key]))}
                    className={cn(
                      'h-8 rounded-full border px-3 text-[13px] font-medium transition-colors',
                      on ? 'border-brand bg-brand text-brand-on' : 'border-border-strong bg-card hover:bg-accent',
                    )}
                  >
                    {opt[locale]}
                  </button>
                )
              })}
            </div>
          </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setArOnly(false)
                setDietary([])
              }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t.clear}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-5 text-sm font-semibold text-background"
            >
              {t.done}
            </button>
          </div>

          {installPlatform === 'prompt' && (
            <button
              type="button"
              onClick={onInstall}
              className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left hover:bg-accent"
            >
              <Download className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t.install}</span>
                <span className="block text-xs text-muted-foreground">{t.installHint}</span>
              </span>
            </button>
          )}
          {installPlatform === 'ios' && (
            <p className="flex items-start gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
              <Download className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              <span>
                <span className="block text-sm font-medium text-foreground">{t.install}</span>
                {t.installIos}
              </span>
            </p>
          )}
          {offlineReady && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
              {t.offlineReady}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
