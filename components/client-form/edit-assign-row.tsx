// components/client-form/edit-assign-row.tsx
// One restaurant in the edit-administrator form's assignment dialog: its name, the Assigned
// badge, the pending-change badge, and the Assign or Remove button.
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Check, Plus, X } from 'lucide-react'

type Restaurant = { id: string; name: string }

export default function EditAssignRow({
  restaurant,
  isAssigned,
  wasOriginallyAssigned,
  onAssign,
  onRemove,
  disabled,
}: {
  restaurant: Restaurant
  isAssigned: boolean
  wasOriginallyAssigned: boolean
  onAssign: (id: string) => void
  onRemove: (id: string) => void
  disabled: boolean
}) {
  const isChanged = isAssigned !== wasOriginallyAssigned

  return (
    <div
      className={`flex items-center justify-between p-4 border-2 rounded-md transition-colors ${
 isAssigned
 ? ' border-border'
 : 'bg-card border-border hover:bg-accent hover:border-accent-foreground/20'
 } ${isChanged ? 'ring-2 ring-offset-2 dark:ring-offset-background' : ''}`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
 isAssigned ? 'bg-muted' : 'bg-muted'
 }`}>
            <Building2 className={`h-4 w-4 ${
 isAssigned ? 'text-muted-foreground dark:text-muted-foreground' : 'text-muted-foreground'
 }`} />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{restaurant.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              {isAssigned && (
                <Badge className="bg-muted text-muted-foreground dark:text-muted-foreground border-border text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Assigned
                </Badge>
              )}
              {isChanged && (
                <Badge className="bg-muted text-warning dark:text-muted-foreground border-border text-xs">
                  {isAssigned ? '✨ New Assignment' : '🗑️ Will be Removed'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isAssigned ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemove(restaurant.id)}
            className="border-border text-destructive dark:text-muted-foreground hover:bg-muted hover:border-border"
            disabled={disabled}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAssign(restaurant.id)}
            className="border-border text-success dark:text-muted-foreground hover:bg-muted hover:border-border dark:"
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Assign
          </Button>
        )}
      </div>
    </div>
  )
}
