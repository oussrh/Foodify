// components/client-form/assigned-restaurants.tsx
// The create-administrator form's list of the restaurants picked so far, each with a remove
// button; the dashed placeholder while none is picked.
'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, X } from 'lucide-react'

type Restaurant = { id: string; name: string }

export default function AssignedRestaurants({
  restaurants,
  selected,
  onRemove,
  disabled,
}: {
  restaurants: Restaurant[]
  selected: string[]
  onRemove: (id: string) => void
  disabled: boolean
}) {
  if (selected.length === 0) {
    return (
      <div className="p-4 bg-muted border-2 border-dashed border-border rounded-lg text-center">
        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-2">No restaurants assigned</p>
        <p className="text-xs text-muted-foreground">
          {restaurants.length > 0 ? 'Click "Assign Restaurants" to select restaurants' : 'No restaurants available to assign'}
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Assigned Restaurants ({selected.length}):</p>
      <div className="space-y-2">
        {selected.map((id) => {
          const restaurant = restaurants.find(r => r.id === id)
          return restaurant ? (
            <div key={id} className="flex items-center justify-between p-3 bg-muted border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                  <Badge className="bg-muted text-muted-foreground border-border text-xs mt-1">
                    Assigned
                  </Badge>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(id)}
                className="text-destructive hover:bg-muted"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null
        })}
      </div>
    </div>
  )
}
