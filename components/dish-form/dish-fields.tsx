// components/dish-form/dish-fields.tsx
// The bilingual rows the create and edit dish forms lay out the same way: the two names and
// the two descriptions. Each takes the props its form registered (typed by that form's own
// values), so no form type is widened here; the create form adds placeholders.
'use client'

import type { FieldError as FieldErrorShape, UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Globe } from 'lucide-react'
import FieldError from '@/components/forms/field-error'

type Bilingual = { en: string; fr: string }

export function DishNameFields({
  nameEn,
  nameFr,
  errors,
  disabled,
  placeholders,
}: {
  nameEn: UseFormRegisterReturn
  nameFr: UseFormRegisterReturn
  errors: { nameEn?: FieldErrorShape; nameFr?: FieldErrorShape }
  disabled: boolean
  placeholders?: Bilingual
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="nameEn" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Globe className="h-4 w-4" />
          English Name
        </Label>
        <Input
          id="nameEn"
          {...nameEn}
          className="border-border focus:border-border-strong"
          placeholder={placeholders?.en}
          disabled={disabled}
        />
        <FieldError error={errors.nameEn} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nameFr" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Globe className="h-4 w-4" />
          French Name
        </Label>
        <Input
          id="nameFr"
          {...nameFr}
          className="border-border focus:border-border-strong"
          placeholder={placeholders?.fr}
          disabled={disabled}
        />
        <FieldError error={errors.nameFr} />
      </div>
    </div>
  )
}

export function DishDescriptionFields({
  descriptionEn,
  descriptionFr,
  disabled,
  placeholders,
}: {
  descriptionEn: UseFormRegisterReturn
  descriptionFr: UseFormRegisterReturn
  disabled: boolean
  placeholders?: Bilingual
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="descriptionEn" className="text-sm font-medium text-muted-foreground">
          English Description
        </Label>
        <Textarea
          id="descriptionEn"
          {...descriptionEn}
          className="border-border focus:border-border-strong min-h-[100px]"
          placeholder={placeholders?.en}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descriptionFr" className="text-sm font-medium text-muted-foreground">
          French Description
        </Label>
        <Textarea
          id="descriptionFr"
          {...descriptionFr}
          className="border-border focus:border-border-strong min-h-[100px]"
          placeholder={placeholders?.fr}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
