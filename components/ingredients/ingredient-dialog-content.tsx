// components/ingredients/ingredient-dialog-content.tsx
// The body of the add and edit ingredient dialogs: the title, the English and French name
// inputs over the manager's draft, Cancel, and the submit with its busy state.
'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

export default function IngredientDialogContent({
  title,
  ids,
  nameEn,
  nameFr,
  onNameEn,
  onNameFr,
  onCancel,
  onSubmit,
  loading,
  busy,
  action,
}: {
  /** The dialog's icon and title. */
  title: ReactNode
  /** The two inputs' ids, so the two dialogs' labels point at their own input. */
  ids: { en: string; fr: string }
  nameEn: string
  nameFr: string
  onNameEn: (value: string) => void
  onNameFr: (value: string) => void
  onCancel: () => void
  onSubmit: () => void
  loading: boolean
  /** The submit's text while the action runs. */
  busy: string
  /** The submit's icon and text otherwise. */
  action: ReactNode
}) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {title}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={ids.en} className="text-sm font-medium">Name (English) *</Label>
            <Input
              id={ids.en}
              value={nameEn}
              onChange={(e) => onNameEn(e.target.value)}
              placeholder="e.g., Tomato"
              className="border-border focus:border-border-strong"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={ids.fr} className="text-sm font-medium">Name (French)</Label>
            <Input
              id={ids.fr}
              value={nameFr}
              onChange={(e) => onNameFr(e.target.value)}
              placeholder="e.g., Tomate"
              className="border-border focus:border-border-strong"
            />
            <p className="text-xs text-muted-foreground">Optional - defaults to English name if empty</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading || !nameEn.trim()}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {busy}
              </>
            ) : (
              action
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  )
}
