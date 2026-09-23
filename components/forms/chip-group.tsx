// components/forms/chip-group.tsx
// A multi-select of vocabulary keys as toggle chips, bilingual on the label: the dish form's
// dietary and allergen pickers and the settings' dietary options share it.
'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface ChipGroupProps {
  id: string
  label: string
  hint?: string
  options: readonly { key: string; en: string; fr: string }[]
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean | undefined
}

/**
 * A multi-select of vocabulary keys as toggle chips, labelled in both languages; the dish form's
 * dietary and allergen pickers and the settings' dietary options share it.
 */
export default function ChipGroup({ id, label, hint, options, value, onChange, disabled }: ChipGroupProps) {
  const toggle = (key: string) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
  return (
    <div className="space-y-2">
      <Label id={`${id}-label`} className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <div role="group" aria-labelledby={`${id}-label`} className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = value.includes(opt.key)
          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              aria-pressed={on}
              onClick={() => toggle(opt.key)}
              className={cn(
                'h-8 rounded-full border px-3 text-[13px] font-medium transition-colors disabled:opacity-50',
                on ? 'border-primary bg-primary text-primary-foreground' : 'border-border-strong bg-card hover:bg-accent',
              )}
            >
              {opt.en}
              <span className={cn('ml-1 font-normal', on ? '' : 'text-muted-foreground')}>· {opt.fr}</span>
            </button>
          )
        })}
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
