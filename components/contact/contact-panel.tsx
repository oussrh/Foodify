'use client'

import { useMemo } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Clock, ExternalLink, Globe, Mail, MapPin, Phone } from 'lucide-react'
import { Facebook, Instagram, Twitter } from '@/components/social-icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cleanPhone, formatAddress } from '@/components/menu/menu-footer'
import { parseSocialMedia } from '@/lib/social-media'
import { hasStructuredHours, openStatus, parseOpeningHours, serializeOpeningHours, summarizeOpeningHours, dayName } from '@/lib/opening-hours'
import { cn } from '@/lib/utils'
import HoursEditor from './hours-editor'

/** The subset of the settings form this panel edits. */
export interface ContactFormValues {
  name: string
  email?: string
  phone?: string
  website?: string
  streetAddress?: string
  city?: string
  state?: string
  postalCode?: string
  country?: string
  openingHours?: string
  socialMedia?: string
}

interface ContactPanelProps {
  register: UseFormRegister<ContactFormValues>
  errors: FieldErrors<ContactFormValues>
  values: ContactFormValues
  onChange: (field: 'openingHours' | 'socialMedia', value: string) => void
  disabled?: boolean
}

const SOCIAL = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@yourrestaurant or a profile link' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'yourpage or a page link' },
  { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: '@yourrestaurant or a profile link' },
] as const

function readSocialJson(raw: string | undefined): Record<'instagram' | 'facebook' | 'twitter', string> {
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

export default function ContactPanel({ register, errors, values, onChange, disabled }: ContactPanelProps) {
  const hours = useMemo(() => parseOpeningHours(values.openingHours), [values.openingHours])
  const social = useMemo(() => readSocialJson(values.socialMedia), [values.socialMedia])
  const socialHandles = useMemo(() => parseSocialMedia(values.socialMedia), [values.socialMedia])

  const setSocial = (key: keyof typeof social, v: string) => {
    const next = { ...social, [key]: v }
    const any = Object.values(next).some((s) => s.trim())
    onChange('socialMedia', any ? JSON.stringify(next) : '')
  }

  const address = formatAddress({
    streetAddress: values.streetAddress || null,
    city: values.city || null,
    state: values.state || null,
    postalCode: values.postalCode || null,
    country: values.country || null,
  })
  const summary = summarizeOpeningHours(hours, 'en')
  const status = openStatus(hours)
  const phone = values.phone ? cleanPhone(values.phone) : ''

  const field = 'flex flex-col gap-1.5'
  const err = (m?: string) => m && <span className="text-xs text-destructive">{m}</span>

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-8">
        {/* Contact */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Contact</h2>
            <p className="text-sm text-muted-foreground">Shown at the bottom of the menu. Phone and email become tap-to-call and tap-to-write links.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={field}>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+212 6 12 34 56 78" disabled={disabled} {...register('phone')} />
              {values.phone && phone !== values.phone.trim() && (
                <span className="text-xs text-muted-foreground">Guests will see: {phone || '—'}</span>
              )}
            </div>
            <div className={field}>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="hello@yourrestaurant.com" disabled={disabled} {...register('email')} />
              {err(errors.email?.message as string | undefined)}
            </div>
            <div className={cn(field, 'sm:col-span-2')}>
              <Label htmlFor="website">Website</Label>
              <Input id="website" type="url" inputMode="url" placeholder="https://yourrestaurant.com" disabled={disabled} {...register('website')} />
              {err(errors.website?.message as string | undefined)}
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold">Address</h2>
              <p className="text-sm text-muted-foreground">Guests get a Directions link that opens their maps app.</p>
            </div>
            {address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Check on Google Maps
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-6">
            <div className={cn(field, 'sm:col-span-6')}>
              <Label htmlFor="streetAddress">Street</Label>
              <Input id="streetAddress" autoComplete="street-address" placeholder="12 Rue Mohammed VI" disabled={disabled} {...register('streetAddress')} />
            </div>
            <div className={cn(field, 'sm:col-span-2')}>
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" autoComplete="postal-code" placeholder="90000" disabled={disabled} {...register('postalCode')} />
            </div>
            <div className={cn(field, 'sm:col-span-4')}>
              <Label htmlFor="city">City</Label>
              <Input id="city" autoComplete="address-level2" placeholder="Tangier" disabled={disabled} {...register('city')} />
            </div>
            <div className={cn(field, 'sm:col-span-3')}>
              <Label htmlFor="state">
                Region <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input id="state" autoComplete="address-level1" disabled={disabled} {...register('state')} />
            </div>
            <div className={cn(field, 'sm:col-span-3')}>
              <Label htmlFor="country">Country</Label>
              <Input id="country" autoComplete="country-name" placeholder="Morocco" disabled={disabled} {...register('country')} />
            </div>
          </div>
        </section>

        {/* Hours */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Opening hours</h2>
            <p className="text-sm text-muted-foreground">Set each day once; guests see a grouped summary and whether you are open right now.</p>
          </div>
          <HoursEditor value={hours} disabled={disabled} onChange={(next) => onChange('openingHours', serializeOpeningHours(next))} />
        </section>

        {/* Social */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Social links</h2>
            <p className="text-sm text-muted-foreground">Paste a handle or a full link — both work.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {SOCIAL.map((s) => (
              <div key={s.key} className={field}>
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
                {social[s.key] && socialHandles[s.key] && (
                  <span className="truncate text-xs text-muted-foreground">
                    {s.key === 'twitter' ? 'x.com' : `${s.key}.com`}/{socialHandles[s.key]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* How guests see it */}
      <aside className="flex flex-col gap-3 lg:order-last lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-xs font-medium text-muted-foreground">As guests see it</p>
          <p className="text-base font-semibold tracking-display">{values.name || 'Your restaurant'}</p>

          {status && (
            <p className={cn('mt-1 flex items-center gap-1.5 text-xs font-medium', status.open ? 'text-success' : 'text-muted-foreground')}>
              <span className={cn('h-1.5 w-1.5 rounded-full', status.open ? 'bg-success' : 'bg-muted-foreground')} />
              {status.open
                ? `Open now · closes ${status.closesAt}`
                : status.opensAt
                  ? `Closed · opens ${status.opensAt}${status.opensOn ? ` ${dayName(status.opensOn, 'en')}` : ''}`
                  : 'Closed'}
            </p>
          )}

          <dl className="mt-4 flex flex-col gap-2.5 text-sm">
            {address && (
              <div className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <dd className="text-muted-foreground">{address}</dd>
              </div>
            )}
            {phone && (
              <div className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <dd className="tnum text-muted-foreground">{phone}</dd>
              </div>
            )}
            {values.email && (
              <div className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <dd className="truncate text-muted-foreground">{values.email}</dd>
              </div>
            )}
            {values.website && (
              <div className="flex gap-2">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <dd className="truncate text-muted-foreground">{values.website.replace(/^https?:\/\//, '')}</dd>
              </div>
            )}
            {(summary.length > 0 || hours.note) && (
              <div className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <dd className="flex flex-col gap-0.5 text-muted-foreground">
                  {summary.map((l) => (
                    <span key={l.days} className="flex justify-between gap-3">
                      <span>{l.days}</span>
                      <span className="tnum">{l.hours}</span>
                    </span>
                  ))}
                  {hours.note && <span className={cn(hasStructuredHours(hours) && 'mt-1 text-xs')}>{hours.note}</span>}
                </dd>
              </div>
            )}
          </dl>

          {SOCIAL.some((s) => socialHandles[s.key]) && (
            <div className="mt-4 flex gap-2">
              {SOCIAL.filter((s) => socialHandles[s.key]).map((s) => <s.icon key={s.key} className="h-4 w-4 text-muted-foreground" />)}
            </div>
          )}

          {!address && !phone && !values.email && !values.website && summary.length === 0 && !hours.note && (
            <p className="mt-3 text-sm text-muted-foreground">Nothing to show yet. Fill in the fields on the left.</p>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">The footer of the public menu. Open status uses the guest’s clock.</p>
      </aside>
    </div>
  )
}
