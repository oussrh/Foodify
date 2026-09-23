// components/dish-form/dish-detail-fields.tsx
// The detail fields of the create and edit dish forms: price, calories, the category select
// and the popular checkbox. Each takes the props its form registered (the edit form registers
// calories as a number, the create form as text with an error line), so no form type is
// widened here.
'use client'

import type { FieldError as FieldErrorShape, UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Utensils } from 'lucide-react'
import FieldError from '@/components/forms/field-error'

type Subcategory = { id: string; nameEn: string }

type RegisteredField = {
  field: UseFormRegisterReturn
  error?: FieldErrorShape | undefined
  disabled: boolean
  placeholder?: string
}

/**
 * The dish price input, in steps of 0.01, bound to whatever registration its form passes, with its
 * error line.
 */
export function DishPriceField({ field, error, disabled, placeholder }: RegisteredField) {
  return (
    <div className="space-y-2">
      <Label htmlFor="price" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <DollarSign className="h-4 w-4" />
        Price
      </Label>
      <Input
        id="price"
        type="number"
        step="0.01"
        {...field}
        className="border-border focus:border-border-strong"
        placeholder={placeholder}
        disabled={disabled}
      />
      <FieldError error={error} />
    </div>
  )
}

/**
 * The optional calories input with its error line. It takes the form's own registration, because
 * the create form registers calories as text and the edit form as a number.
 */
export function DishCaloriesField({ field, error, disabled, placeholder }: RegisteredField) {
  return (
    <div className="space-y-2">
      <Label htmlFor="calories" className="text-sm font-medium text-muted-foreground">
        Calories (optional)
      </Label>
      <Input
        id="calories"
        type="number"
        {...field}
        className="border-border focus:border-border-strong"
        placeholder={placeholder}
        disabled={disabled}
      />
      <FieldError error={error} />
    </div>
  )
}

/**
 * The dish's category select, listing the restaurant's subcategories by English name; its empty
 * option, No category, leaves the dish without one.
 */
export function DishCategorySelect({
  field,
  subcategories,
  disabled,
}: {
  field: UseFormRegisterReturn
  subcategories: Subcategory[]
  disabled: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="subcategory" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Utensils className="h-4 w-4" />
        Category
      </Label>
      <select
        id="subcategory"
        {...field}
        className="w-full border border-border focus:border-border-strong rounded-md px-3 py-2 text-sm focus:outline-hidden focus:ring-2"
        disabled={disabled}
      >
        <option value="">No category</option>
        {subcategories.map((s: Subcategory) => (
          <option key={s.id} value={s.id}>
            {s.nameEn}
          </option>
        ))}
      </select>
    </div>
  )
}

/** The checkbox that marks a dish as popular (isMostPurchased), under a Special Options heading. */
export function DishPopularCheckbox({ field, disabled }: { field: UseFormRegisterReturn; disabled: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-none text-muted-foreground">Special Options</p>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...field}
            className="rounded border-border text-muted-foreground"
            disabled={disabled}
          />
          <span className="text-sm text-muted-foreground">Mark as Popular Dish</span>
        </label>
      </div>
    </div>
  )
}
