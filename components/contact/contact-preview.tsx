'use client'

import { Clock, Globe, Mail, MapPin, Phone } from 'lucide-react'
import type { SocialHandles } from '@/lib/social-media'
import { dayName, hasStructuredHours, openStatus, summarizeOpeningHours, type OpeningHours } from '@/lib/opening-hours'
import { cn } from '@/lib/utils'
import { SOCIAL } from './social-links'
import OpeningHoursLines from '@/components/opening-hours-lines'

interface ContactPreviewProps {
  name: string
  address: string | null
  /** The phone as guests will see it, '' when none */
  phone: string
  email: string | undefined
  website: string | undefined
  hours: OpeningHours
  handles: SocialHandles
}

/** Open or closed on the guest's clock, and when that changes. */
function OpenStatusLine({ hours }: { hours: OpeningHours }) {
  const status = openStatus(hours)
  if (!status) return null
  return (
    <p className={cn('mt-1 flex items-center gap-1.5 text-xs font-medium', status.open ? 'text-success' : 'text-muted-foreground')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', status.open ? 'bg-success' : 'bg-muted-foreground')} />
      {status.open
        ? `Open now · closes ${status.closesAt}`
        : status.opensAt
          ? `Closed · opens ${status.opensAt}${status.opensOn ? ` ${dayName(status.opensOn, 'en')}` : ''}`
          : 'Closed'}
    </p>
  )
}

/** The grouped weekly summary and the note, as the menu footer lays them out. */
function HoursRow({ hours, summary }: { hours: OpeningHours; summary: ReturnType<typeof summarizeOpeningHours> }) {
  return (
    <li className="flex gap-2">
      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span className="text-muted-foreground">
        <OpeningHoursLines lines={summary} note={hours.note} noteClassName={cn(hasStructuredHours(hours) && 'mt-1 text-xs')} />
      </span>
    </li>
  )
}

/** The footer of the public menu as the current values would render it. */
export default function ContactPreview({ name, address, phone, email, website, hours, handles }: ContactPreviewProps) {
  const summary = summarizeOpeningHours(hours, 'en')
  const rows = [
    { key: 'address', icon: MapPin, text: address, className: 'text-muted-foreground' },
    { key: 'phone', icon: Phone, text: phone, className: 'tnum text-muted-foreground' },
    { key: 'email', icon: Mail, text: email, className: 'truncate text-muted-foreground' },
    { key: 'website', icon: Globe, text: website?.replace(/^https?:\/\//, ''), className: 'truncate text-muted-foreground' },
  ].filter((r) => r.text)
  const hasHours = summary.length > 0 || Boolean(hours.note)

  return (
    <aside className="flex flex-col gap-3 lg:order-last lg:sticky lg:top-28 lg:self-start">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">As guests see it</p>
        <p className="text-base font-semibold tracking-display">{name || 'Your restaurant'}</p>

        <OpenStatusLine hours={hours} />

        <ul className="mt-4 flex flex-col gap-2.5 text-sm">
          {rows.map((r) => (
            <li key={r.key} className="flex gap-2">
              <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className={r.className}>{r.text}</span>
            </li>
          ))}
          {hasHours && <HoursRow hours={hours} summary={summary} />}
        </ul>

        {SOCIAL.some((s) => handles[s.key]) && (
          <div className="mt-4 flex gap-2">
            {SOCIAL.filter((s) => handles[s.key]).map((s) => <s.icon key={s.key} className="h-4 w-4 text-muted-foreground" />)}
          </div>
        )}

        {rows.length === 0 && !hasHours && (
          <p className="mt-3 text-sm text-muted-foreground">Nothing to show yet. Fill in the fields on the left.</p>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">The footer of the public menu. Open status uses the guest’s clock.</p>
    </aside>
  )
}
