// components/client-form/edit-assigned-list.tsx
// The edit-administrator form's list of assigned restaurants: the count, the New badge on
// an assignment not yet saved, a remove button per row; the dashed placeholder with a button
// to open the dialog while none is assigned.
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Building2, Check, Plus, Sparkles, X } from 'lucide-react'

type Restaurant = { id: string; name: string }

export default function EditAssignedList({
  restaurants,
  selected,
  original,
  onRemove,
  onOpenDialog,
  disabled,
}: {
  restaurants: Restaurant[]
  selected: string[]
  /** The ids assigned when the form opened, for the New badge. */
  original?: string[] | undefined
  onRemove: (id: string) => void
  onOpenDialog: () => void
  disabled: boolean
}) {
  return (
    <div className="space-y-4">
      {selected.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-border rounded-md text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No restaurants assigned</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This administrator doesn&apos;t have access to any restaurants yet
          </p>
          <Button
            type="button"
            onClick={onOpenDialog}
            className="bg-primary hover:bg-primary text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Restaurants
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Assigned Restaurants ({selected.length})
            </Label>
            <Badge className="badge-secondary">
              {selected.length} {selected.length === 1 ? 'restaurant' : 'restaurants'}
            </Badge>
          </div>

          <div className="grid gap-3">
            {selected.map((restaurantId) => {
              const restaurant = restaurants.find(r => r.id === restaurantId)
              const wasOriginallyAssigned = original?.includes(restaurantId) || false
              const isNewAssignment = !wasOriginallyAssigned

              return restaurant ? (
                <div key={restaurantId} className="flex items-center justify-between p-4 border border-border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Building2 className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-muted text-muted-foreground dark:text-muted-foreground border-border text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Assigned
                        </Badge>
                        {isNewAssignment && (
                          <Badge className="bg-muted text-success dark:text-muted-foreground border-border text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(restaurantId)}
                    aria-label={`Remove ${restaurant.name}`}
                    className="text-destructive dark:text-muted-foreground hover:bg-muted hover:text-destructive dark:hover:text-muted-foreground"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}
