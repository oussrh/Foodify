// components/ingredients/ingredient-row.tsx
// One ingredient in the manager's list: its rank, its two names (the French one only when it
// differs), and the edit and delete buttons that appear on hover.
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, Trash2 } from 'lucide-react'

export interface Ingredient {
  id: string
  nameEn: string
  nameFr: string
}

/**
 * One ingredient in the list: its rank, its English name and the French one only when it differs,
 * and edit and delete buttons shown on hover or focus.
 */
export default function IngredientRow({
  ingredient,
  index,
  loading,
  onEdit,
  onDelete,
}: {
  ingredient: Ingredient
  index: number
  loading: boolean
  onEdit: (ingredient: Ingredient) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className="group flex items-center justify-between p-4 border-2 border-border rounded-md hover:border-border hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-warning">#{index + 1}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="bg-card border-border text-warning font-medium"
          >
            {ingredient.nameEn}
          </Badge>
          {ingredient.nameFr && ingredient.nameFr !== ingredient.nameEn && (
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground border-border"
            >
              {ingredient.nameFr}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(ingredient)}
          disabled={loading}
          aria-label={`Edit ${ingredient.nameEn}`}
          className="h-8 w-8 p-0 hover:bg-muted hover:text-muted-foreground"
        >
          <Edit2 className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(ingredient.id)}
          disabled={loading}
          aria-label={`Delete ${ingredient.nameEn}`}
          className="h-8 w-8 p-0 hover:bg-muted hover:text-destructive text-muted-foreground"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
