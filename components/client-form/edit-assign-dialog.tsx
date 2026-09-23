// components/client-form/edit-assign-dialog.tsx
// The "Manage Assignments" dialog of the edit-administrator form: a search box, the
// assigned-only filter with the result count, the pending-changes summary, one row per
// restaurant and the empty result. Opened from its own trigger or from the empty list.
'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Building2, Search, Settings, Sparkles, Filter } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import EditAssignRow from './edit-assign-row'

type Restaurant = { id: string; name: string }

export type AssignmentChanges = { added: string[]; removed: string[] }

/**
 * The Manage Assignments dialog of the edit-client form: search, an assigned-only filter, a count
 * of pending additions and removals, and one row per restaurant. The caller holds the open state,
 * so the empty list can open it too.
 */
export default function EditAssignDialog({
  open,
  onOpenChange,
  restaurants,
  selected,
  original,
  changes,
  onAssign,
  onRemove,
  disabled,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurants: Restaurant[]
  selected: string[]
  /** The ids assigned when the form opened, for the change badges. */
  original?: string[] | undefined
  changes: AssignmentChanges
  onAssign: (id: string) => void
  onRemove: (id: string) => void
  disabled: boolean
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAssignedOnly, setShowAssignedOnly] = useState(false)

  // Filter restaurants based on search and toggle
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())
      const isAssigned = selected.includes(restaurant.id)

      if (showAssignedOnly) {
        return matchesSearch && isAssigned
      }
      return matchesSearch
    })
  }, [restaurants, searchTerm, selected, showAssignedOnly])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-2 border-border text-muted-foreground dark:text-muted-foreground hover:bg-muted hover:border-border dark: transition-colors"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Assignments
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-background border-border">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl text-foreground">
            <div className="p-2 bg-muted rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
            </div>
            <div>
              <span>Manage Restaurant Assignments</span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Select which restaurants this administrator can manage
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Controls */}
          <div className="shrink-0 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant={showAssignedOnly ? "default" : "outline"}
                onClick={() => setShowAssignedOnly(!showAssignedOnly)}
                className={showAssignedOnly
                  ? "bg-primary hover:bg-primary text-white"
                  : "btn-outline"
                }
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAssignedOnly ? "Show All" : "Assigned Only"}
              </Button>

              <Badge className="badge-secondary">
                {filteredRestaurants.length} restaurants
              </Badge>
            </div>
          </div>

          {/* Assignment Summary */}
          {(changes.added.length > 0 || changes.removed.length > 0) && (
            <div className="shrink-0 p-4 border border-border rounded-md">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-muted-foreground dark:text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Pending Changes</p>
                  <div className="flex flex-wrap gap-2">
                    {changes.added.length > 0 && (
                      <Badge className="bg-muted text-success dark:text-muted-foreground border-border text-xs">
                        +{changes.added.length} Added
                      </Badge>
                    )}
                    {changes.removed.length > 0 && (
                      <Badge className="bg-muted text-destructive dark:text-muted-foreground border-border text-xs">
                        -{changes.removed.length} Removed
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Restaurant List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {filteredRestaurants.map((restaurant) => (
              <EditAssignRow
                key={restaurant.id}
                restaurant={restaurant}
                isAssigned={selected.includes(restaurant.id)}
                wasOriginallyAssigned={original?.includes(restaurant.id) || false}
                onAssign={onAssign}
                onRemove={onRemove}
                disabled={disabled}
              />
            ))}
          </div>

          {filteredRestaurants.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No restaurants found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "No restaurants available for assignment"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
