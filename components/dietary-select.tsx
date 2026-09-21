'use client'

import ChipGroup from '@/components/forms/chip-group'
import { ALLERGEN_OPTIONS, offeredDietary } from '@/lib/menu'

interface DietarySelectProps {
  /** The dietary attributes the restaurant offers (Settings → General); the picker shows these and no other. */
  dietaryOptions: readonly string[]
  dietary: string[]
  allergens: string[]
  onDietaryChange: (next: string[]) => void
  onAllergensChange: (next: string[]) => void
  disabled?: boolean
}

/** Dietary attributes (only those the restaurant offers) and allergens for a dish. Shown to diners as chips and filters. */
export default function DietarySelect({ dietaryOptions, dietary, allergens, onDietaryChange, onAllergensChange, disabled }: DietarySelectProps) {
  const offered = offeredDietary(dietaryOptions)
  return (
    <div className="grid gap-5">
      {offered.length > 0 && (
        <ChipGroup
          id="dietary"
          label="Dietary"
          hint="Diners can filter the menu by these. The list is set in the restaurant's settings."
          options={offered}
          value={dietary}
          onChange={onDietaryChange}
          disabled={disabled}
        />
      )}
      <ChipGroup
        id="allergens"
        label="Contains allergens"
        hint="Listed on the dish page as “Contains …”."
        options={ALLERGEN_OPTIONS}
        value={allergens}
        onChange={onAllergensChange}
        disabled={disabled}
      />
    </div>
  )
}
