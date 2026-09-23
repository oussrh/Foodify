// components/ingredients/empty-ingredients.tsx
// The dashed placeholder while a dish has no ingredient, with a button that opens the add dialog.
'use client'

import { Button } from '@/components/ui/button'
import { ChefHat, Plus } from 'lucide-react'

/** The dashed placeholder shown while a dish has no ingredient; its button opens the add dialog. */
export default function EmptyIngredients({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12 border-2 border-dashed border-border rounded-md bg-muted">
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <ChefHat className="h-8 w-8 text-warning" />
        </div>
        <div className="space-y-2">
          <p className="font-medium text-foreground">No ingredients added yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Add ingredients to help customers with allergies and dietary preferences make informed choices.
          </p>
        </div>
        <Button
          onClick={onAdd}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add First Ingredient
        </Button>
      </div>
    </div>
  )
}
