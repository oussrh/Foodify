// components/client-form/create-assign-dialog.tsx
// The "Assign Restaurants" dialog of the create-administrator form: a search box over every
// restaurant, an Assign or Remove button per row, and the empty result.
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, X, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Restaurant = { id: string; name: string }

/**
 * The Assign Restaurants dialog of the create-client form: a name search over every restaurant,
 * with Assign or Remove on each row. It only reports the choice through its callbacks; the form
 * keeps the selection.
 */
export default function CreateAssignDialog({
  restaurants,
  selected,
  onAssign,
  onRemove,
  disabled,
}: {
  restaurants: Restaurant[]
  selected: string[]
  onAssign: (id: string) => void
  onRemove: (id: string) => void
  disabled: boolean
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted">
          <Plus className="h-4 w-4 mr-2" />
          Assign Restaurants
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Assign Restaurants to User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border focus:border-border-strong"
            />
          </div>

          {/* Restaurant List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {restaurants
              .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((restaurant) => {
                const isAssigned = selected.includes(restaurant.id)

                return (
                  <div
                    key={restaurant.id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
 isAssigned ? 'bg-muted border-border' : 'bg-card border-border hover:bg-muted'
 }`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{restaurant.name}</h4>
                      {isAssigned && (
                        <Badge className="bg-muted text-muted-foreground border-border text-xs mt-1">
                          Assigned
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAssigned ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRemove(restaurant.id)}
                          className="border-border text-destructive hover:bg-muted"
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
                          className="border-border text-success hover:bg-muted"
                          disabled={disabled}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>

          {restaurants.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No restaurants found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
