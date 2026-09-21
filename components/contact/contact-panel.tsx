'use client'

import { useMemo } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { cleanPhone, formatAddress } from '@/components/menu/contact-format'
import { parseSocialMedia } from '@/lib/social'
import { parseOpeningHours, serializeOpeningHours } from '@/lib/opening-hours'
import HoursEditor from './hours-editor'
import ContactFields from './contact-fields'
import AddressFields from './address-fields'
import SocialLinks from './social-links'
import ContactPreview from './contact-preview'
import type { ContactFormValues } from './contact-form-values'

// The settings form imports the panel's value type from here.
export type { ContactFormValues } from './contact-form-values'

interface ContactPanelProps {
  register: UseFormRegister<ContactFormValues>
  errors: FieldErrors<ContactFormValues>
  values: ContactFormValues
  onChange: (field: 'openingHours' | 'socialMedia' | 'socialDisplay', value: string) => void
  disabled?: boolean
}

export default function ContactPanel({ register, errors, values, onChange, disabled }: ContactPanelProps) {
  const hours = useMemo(() => parseOpeningHours(values.openingHours), [values.openingHours])
  const socialHandles = useMemo(() => parseSocialMedia(values.socialMedia), [values.socialMedia])

  const address = formatAddress({
    streetAddress: values.streetAddress || null,
    city: values.city || null,
    state: values.state || null,
    postalCode: values.postalCode || null,
    country: values.country || null,
  })
  const phone = values.phone ? cleanPhone(values.phone) : ''

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-8">
        {/* Contact */}
        <ContactFields register={register} errors={errors} phone={values.phone} cleanedPhone={phone} disabled={disabled} />

        {/* Address */}
        <AddressFields register={register} address={address} disabled={disabled} />

        {/* Hours */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Opening hours</h2>
            <p className="text-sm text-muted-foreground">Set each day once; guests see a grouped summary and whether you are open right now.</p>
          </div>
          <HoursEditor value={hours} disabled={disabled} onChange={(next) => onChange('openingHours', serializeOpeningHours(next))} />
        </section>

        {/* Social */}
        <SocialLinks
          value={values.socialMedia}
          handles={socialHandles}
          display={values.socialDisplay === 'text' ? 'text' : 'icons'}
          onChange={(json) => onChange('socialMedia', json)}
          onDisplayChange={(d) => onChange('socialDisplay', d)}
          disabled={disabled}
        />
      </div>

      {/* How guests see it */}
      <ContactPreview
        name={values.name}
        address={address}
        phone={phone}
        email={values.email}
        website={values.website}
        hours={hours}
        handles={socialHandles}
        socialDisplay={values.socialDisplay === 'text' ? 'text' : 'icons'}
      />
    </div>
  )
}
