// components/dish-form/dish-details-grid.tsx
// The "Price and Details" block both dish forms render: price, calories, the dietary and
// allergen pickers (offering the restaurant's dietary options), the category select, the hidden
// image URL and the popular checkbox, two fields per row with the pickers on a row of their
// own. Each form registers its own fields (the create form's calories as text with a
// placeholder, the edit form's as a number) and hands them here.
'use client'

import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import DietarySelect from '@/components/dietary-select'
import { DishCaloriesField, DishCategorySelect, DishPopularCheckbox, DishPriceField } from '@/components/dish-form/dish-detail-fields'

type Registered = { field: UseFormRegisterReturn; error?: FieldError | undefined; placeholder?: string }

export type DishDetailsGridProps = {
  price: Registered
  calories: Registered
  subcategoryId: UseFormRegisterReturn
  imageUrl: { field: UseFormRegisterReturn; value: string }
  isMostPurchased: UseFormRegisterReturn
  subcategories: { id: string; nameEn: string }[]
  /** The restaurant's dietary options and the dish's current tags, with the setters that dirty the form. */
  tags: { dietaryOptions: readonly string[]; dietary: string[]; allergens: string[]; onDietaryChange: (v: string[]) => void; onAllergensChange: (v: string[]) => void }
  disabled: boolean
}

/**
 * The Price and Details block of both dish forms: price, calories, category, the popular flag, the
 * dietary and allergen pickers limited to the restaurant's options, and the hidden image URL. Each
 * form registers its own fields.
 */
export default function DishDetailsGrid({ price, calories, subcategoryId, imageUrl, isMostPurchased, subcategories, tags, disabled }: DishDetailsGridProps) {
  return (
    <>
      {/* Two fields per row: price and calories, then the category and the popular flag; the pickers take a full row. */}
      <div className="grid gap-6 md:grid-cols-2">
        <DishPriceField field={price.field} error={price.error} disabled={disabled} {...(price.placeholder !== undefined ? { placeholder: price.placeholder } : {})} />
        <DishCaloriesField field={calories.field} error={calories.error} disabled={disabled} {...(calories.placeholder !== undefined ? { placeholder: calories.placeholder } : {})} />
        <DishCategorySelect field={subcategoryId} subcategories={subcategories} disabled={disabled} />
        <DishPopularCheckbox field={isMostPurchased} disabled={disabled} />
        <div className="md:col-span-2">
          <DietarySelect
            dietaryOptions={tags.dietaryOptions}
            dietary={tags.dietary}
            allergens={tags.allergens}
            onDietaryChange={tags.onDietaryChange}
            onAllergensChange={tags.onAllergensChange}
            disabled={disabled}
          />
        </div>
      </div>

      {/* The image URL travels as a hidden field; the upload component sets it. */}
      <input type="hidden" {...imageUrl.field} value={imageUrl.value} />
    </>
  )
}
