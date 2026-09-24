// components/restaurant-form/profile-text-fields.tsx
// The tagline, the description and the cuisine of the create and the settings forms, each with
// the line `restaurantInput` refuses it with (the tagline and the cuisine are bounded, the
// description too): the two forms register their own fields and pass them in.
import type { ReactNode } from 'react'
import type { FieldError as FieldErrorShape, UseFormRegisterReturn } from 'react-hook-form'
import { ChefHat } from 'lucide-react'
import FieldError from '@/components/forms/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type TextField = 'tagline' | 'description' | 'cuisineType'

interface ProfileTextFieldsProps {
  /** Each field's registration, from the form that owns it. */
  fields: Record<TextField, UseFormRegisterReturn>
  errors: Partial<Record<TextField, FieldErrorShape>>
  /** The create form's examples; the settings form shows the stored values instead. */
  placeholders?: Record<TextField, string>
  /** What sits beside the cuisine on its row (the dietary options). */
  children: ReactNode
}

/** Tagline, description and cuisine, each with its error line; the cuisine's row takes `children` beside it. */
export default function ProfileTextFields({ fields, errors, placeholders, children }: ProfileTextFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" {...fields.tagline} placeholder={placeholders?.tagline} className="border-border" />
        <FieldError error={errors.tagline} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...fields.description} placeholder={placeholders?.description} className="border-border min-h-[100px]" />
        <FieldError error={errors.description} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="cuisineType" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Cuisine Type
          </Label>
          <Input id="cuisineType" {...fields.cuisineType} placeholder={placeholders?.cuisineType} className="border-border" />
          <FieldError error={errors.cuisineType} />
        </div>

        <div className="space-y-2 md:pt-6">{children}</div>
      </div>
    </>
  )
}
