'use client'

import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ContactFormValues } from './contact-form-values'

/** The layout of one labelled field, shared by the panel's field groups. */
export const FIELD = 'flex flex-col gap-1.5'

interface ContactFieldsProps {
  register: UseFormRegister<ContactFormValues>
  errors: FieldErrors<ContactFormValues>
  /** The phone as typed */
  phone: string | undefined
  /** The phone as guests will see it (cleanPhone), '' when none */
  cleanedPhone: string
  disabled?: boolean | undefined
}

const err = (m?: string) => m && <span className="text-xs text-destructive">{m}</span>

/** Phone, email and website: what becomes tap-to-call and tap-to-write on the menu. */
export default function ContactFields({ register, errors, phone, cleanedPhone, disabled }: ContactFieldsProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold">Contact</h2>
        <p className="text-sm text-muted-foreground">Shown at the bottom of the menu. Phone and email become tap-to-call and tap-to-write links.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={FIELD}>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+212 6 12 34 56 78" disabled={disabled} {...register('phone')} />
          {phone && cleanedPhone !== phone.trim() && (
            <span className="text-xs text-muted-foreground">Guests will see: {cleanedPhone || 'not set'}</span>
          )}
        </div>
        <div className={FIELD}>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="hello@yourrestaurant.com" disabled={disabled} {...register('email')} />
          {err(errors.email?.message as string | undefined)}
        </div>
        <div className={cn(FIELD, 'sm:col-span-2')}>
          <Label htmlFor="website">Website</Label>
          <Input id="website" type="url" inputMode="url" placeholder="https://yourrestaurant.com" disabled={disabled} {...register('website')} />
          {err(errors.website?.message as string | undefined)}
        </div>
      </div>
    </section>
  )
}
