'use client'

import type { UseFormRegister } from 'react-hook-form'
import { ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FIELD } from './contact-fields'
import type { ContactFormValues } from './contact-form-values'

interface AddressFieldsProps {
  register: UseFormRegister<ContactFormValues>
  /** The address as the menu formats it, or null while it is empty */
  address: string | null
  disabled?: boolean | undefined
}

/** Street, postal code, city, region and country, with a link to check the result on a map. */
export default function AddressFields({ register, address, disabled }: AddressFieldsProps) {
  return (
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
        <div className={cn(FIELD, 'sm:col-span-6')}>
          <Label htmlFor="streetAddress">Street</Label>
          <Input id="streetAddress" autoComplete="street-address" placeholder="12 Rue Mohammed VI" disabled={disabled} {...register('streetAddress')} />
        </div>
        <div className={cn(FIELD, 'sm:col-span-2')}>
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" autoComplete="postal-code" placeholder="90000" disabled={disabled} {...register('postalCode')} />
        </div>
        <div className={cn(FIELD, 'sm:col-span-4')}>
          <Label htmlFor="city">City</Label>
          <Input id="city" autoComplete="address-level2" placeholder="Tangier" disabled={disabled} {...register('city')} />
        </div>
        <div className={cn(FIELD, 'sm:col-span-3')}>
          <Label htmlFor="state">
            Region <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="state" autoComplete="address-level1" disabled={disabled} {...register('state')} />
        </div>
        <div className={cn(FIELD, 'sm:col-span-3')}>
          <Label htmlFor="country">Country</Label>
          <Input id="country" autoComplete="country-name" placeholder="Morocco" disabled={disabled} {...register('country')} />
        </div>
      </div>
    </section>
  )
}
