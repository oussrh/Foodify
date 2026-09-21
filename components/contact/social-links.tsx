'use client'

import { useMemo } from 'react'
import { SOCIAL_ICONS } from '@/components/social-icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { SOCIAL_NETWORKS, parseSocialMedia, socialUrl, type SocialHandles, type SocialKey } from '@/lib/social'
import { FIELD } from './contact-fields'

/** The raw text of each network from the stored value: the JSON as typed, or what the parser makes of legacy free text. */
function readSocial(raw: string | undefined): Record<SocialKey, string> {
  const blank = Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.key, ''])) as Record<SocialKey, string>
  if (!raw) return blank
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>
      const out = { ...blank }
      for (const n of SOCIAL_NETWORKS) if (typeof obj[n.key] === 'string') out[n.key] = obj[n.key] as string
      return out
    }
  } catch {
    // legacy free text: show what the parser makes of it
  }
  const p = parseSocialMedia(raw)
  return Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.key, p[n.key] ?? ''])) as Record<SocialKey, string>
}

interface SocialLinksProps {
  /** The stored JSON (or legacy free text). */
  value: string | undefined
  /** What the menu makes of it, for the preview under each field. */
  handles: SocialHandles
  /** Whether the footer shows the links as icons or text. */
  display: 'icons' | 'text'
  onChange: (json: string) => void
  onDisplayChange: (display: 'icons' | 'text') => void
  disabled?: boolean | undefined
}

/** One row per network (a handle or a full link both work), and a choice of icons or text in the footer. The stored value is JSON. */
export default function SocialLinks({ value, handles, display, onChange, onDisplayChange, disabled }: SocialLinksProps) {
  const social = useMemo(() => readSocial(value), [value])

  const setSocial = (key: SocialKey, v: string) => {
    const next = { ...social, [key]: v }
    const kept = Object.fromEntries(Object.entries(next).filter(([, s]) => s.trim()))
    onChange(Object.keys(kept).length ? JSON.stringify(kept) : '')
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Social links</h2>
        <p className="text-sm text-muted-foreground">Paste a handle or a full link; both work. Leave a network blank to hide it.</p>
      </div>

      <div className="flex flex-col gap-3">
        {SOCIAL_NETWORKS.map((n) => {
          const Icon = SOCIAL_ICONS[n.key]
          const handle = handles[n.key]
          return (
            <div key={n.key} className={cn(FIELD, 'gap-1')}>
              <Label htmlFor={`social-${n.key}`} className="flex items-center gap-1.5">
                {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                {n.label}
              </Label>
              <Input
                id={`social-${n.key}`}
                value={social[n.key]}
                placeholder={n.placeholder}
                disabled={disabled}
                spellCheck={false}
                inputMode={n.kind === 'phone' ? 'tel' : 'text'}
                onChange={(e) => setSocial(n.key, e.target.value)}
              />
              {social[n.key] && handle && (
                <span className="truncate text-xs text-muted-foreground">{socialUrl(n.key, handle).replace(/^https?:\/\//, '')}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">On the menu, show these as</span>
        <div role="radiogroup" aria-label="How the footer shows social links" className="flex rounded-md border border-input bg-card p-0.5">
          {(['icons', 'text'] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={display === d}
              disabled={disabled}
              onClick={() => onDisplayChange(d)}
              className={cn(
                'flex-1 rounded-[4px] px-3 py-1.5 text-sm font-medium capitalize transition-colors disabled:opacity-50',
                display === d ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
