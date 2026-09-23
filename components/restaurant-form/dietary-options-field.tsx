// components/restaurant-form/dietary-options-field.tsx
// The "Dietary options" field of the restaurant forms' General section: which of the menu's
// dietary attributes this restaurant offers. The dish forms offer these and the public menu
// shows these (its filter chips and the tags on a dish); a dish's other tags stay stored, unseen.
'use client'

import ChipGroup from '@/components/forms/chip-group'
import { DIETARY_OPTIONS } from '@/lib/menu'

/**
 * Chooses which dietary attributes a restaurant offers: the dish forms offer only these and the
 * public menu shows and filters by only these; a dish's other stored tags stay unseen.
 */
export default function DietaryOptionsField({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  return (
    <ChipGroup
      id="dietaryOptions"
      label="Dietary options"
      hint="What your dishes can be tagged with, and what diners can filter by. Turn off what you never serve."
      options={DIETARY_OPTIONS}
      value={value}
      onChange={onChange}
    />
  )
}
