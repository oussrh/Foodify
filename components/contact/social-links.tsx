'use client'

import { useMemo } from 'react'
import { Facebook, Instagram, Twitter } from '@/components/social-icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseSocialMedia, type SocialHandles } from '@/lib/social-media'
import { FIELD } from './contact-fields'

export const SOCIAL = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@yourrestaurant or a profile link' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'yourpage or a page link' },
  { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: '@yourrestaurant or a profile link' },
] as const

type SocialKey = (typeof SOCIAL)[number]['key']

function readSocialJson(raw: string | undefined): Record<SocialKey, string> {
  const blank = { instagram: '', facebook: '', twitter: '' }
  if (!raw) return blank
  try {
    const j = JSON.parse(raw)
    if (j && typeof j === 'object') {
      return { instagram: j.instagram ?? '', facebook: j.facebook ?? '', twitter: j.twitter ?? '' }
    }
  } catch {
    // legacy free text: show what the parser makes of it
  }
  const p = parseSocialMedia(raw)
  return { instagram: p.instagram ?? '', facebook: p.facebook ?? '', twitter: p.twitter ?? '' }
}

interface SocialLinksProps {
  /** The stored JSON (or legacy free text) */
  value: string | undefined
  /** What the menu makes of it, for the preview under each field */
  handles: SocialHandles
  onChange: (json: string) => void
  disabled?: boolean
}

/** One field per network; a handle or a full link both work, and the stored value is JSON. */
export default function SocialLinks({ value, handles, onChange, disabled }: SocialLinksProps) {
  const social = useMemo(() => readSocialJson(value), [value])

  const setSocial = (key: SocialKey, v: string) => {
    const next = { ...social, [key]: v }
    const any = Object.values(next).some((s) => s.trim())
    onChange(any ? JSON.stringify(next) : '')
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Social links</h2>
        <p className="text-sm text-muted-foreground">Paste a handle or a full link; both work.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {SOCIAL.map((s) => (
          <div key={s.key} className={FIELD}>
            <Label htmlFor={`social-${s.key}`} className="flex items-center gap-1.5">
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {s.label}
            </Label>
            <Input
              id={`social-${s.key}`}
              value={social[s.key]}
              placeholder={s.placeholder}
              disabled={disabled}
              spellCheck={false}
              onChange={(e) => setSocial(s.key, e.target.value)}
            />
            {social[s.key] && handles[s.key] && (
              <span className="truncate text-xs text-muted-foreground">
                {s.key === 'twitter' ? 'x.com' : `${s.key}.com`}/{handles[s.key]}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
