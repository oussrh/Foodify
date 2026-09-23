// components/dish-form/create-dish-submit.tsx
// The create form's submit row: the button with its busy state, and the unsaved-changes note
// once a field was touched.
'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, Save } from 'lucide-react'

/**
 * The create-dish form's submit row: the Create Dish button, disabled until a field is touched and
 * while it saves, and an unsaved-changes note.
 */
export default function CreateDishSubmit({ isSubmitting, isDirty }: { isSubmitting: boolean; isDirty: boolean }) {
  return (
    <div className="flex items-center gap-4 pt-4 border-t border-border">
      <Button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="flex-1 disabled:opacity-50"
        size="lg"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Creating Dish...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Create Dish
          </div>
        )}
      </Button>

      {isDirty && (
        <div className="flex items-center text-sm text-warning">
          <AlertCircle className="h-4 w-4 mr-1" />
          Unsaved changes
        </div>
      )}
    </div>
  )
}
