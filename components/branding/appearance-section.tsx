'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import type { MenuTheme } from '@/lib/menu'
import { cn } from '@/lib/utils'

interface AppearanceSectionProps {
  value: MenuTheme
  onChange: (theme: MenuTheme) => void
  disabled?: boolean | undefined
}

const APPEARANCE: { key: MenuTheme; label: string; hint: string; icon: typeof Sun }[] = [
  { key: 'system', label: 'Follow device', hint: 'Light or dark, whatever the guest’s phone uses. They can switch.', icon: Monitor },
  { key: 'light', label: 'Always light', hint: 'Paper background, no toggle.', icon: Sun },
  { key: 'dark', label: 'Always dark', hint: 'Best for dim rooms and dark photography.', icon: Moon },
]

/** Follow the device, always light or always dark: how the menu looks on a guest's phone. */
export default function AppearanceSection({ value, onChange, disabled }: AppearanceSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground">How the menu looks on a guest’s phone.</p>
      </div>
      <div role="radiogroup" aria-label="Menu appearance" className="grid gap-2 sm:grid-cols-3">
        {APPEARANCE.map((opt) => {
          const active = value === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(opt.key)}
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
  )
}
