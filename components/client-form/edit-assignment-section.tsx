// components/client-form/edit-assignment-section.tsx
// The "Restaurant Assignment" section of the edit-administrator form: the heading with the
// dialog's trigger, and the list of current assignments. The dialog's open state lives here,
// since the list's empty state opens it too.
'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import EditAssignDialog, { type AssignmentChanges } from './edit-assign-dialog'
import EditAssignedList from './edit-assigned-list'

type Restaurant = { id: string; name: string }

/**
 * The Restaurant Assignment section of the edit-client form: the assignment dialog and the list of
 * current assignments. It owns the dialog's open state because the list's empty state opens it too.
 */
export default function EditAssignmentSection({
  restaurants,
  selected,
  original,
  changes,
  onAssign,
  onRemove,
  disabled,
}: {
  restaurants: Restaurant[]
  selected: string[]
  /** The ids assigned when the form opened, for the change badges. */
  original?: string[] | undefined
  changes: AssignmentChanges
  onAssign: (id: string) => void
  onRemove: (id: string) => void
  disabled: boolean
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">
            <Building2 className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Restaurant Assignment</h3>
            <p className="text-sm text-muted-foreground">Manage which restaurants this user can access</p>
          </div>
        </div>

        <EditAssignDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          restaurants={restaurants}
          selected={selected}
          original={original}
          changes={changes}
          onAssign={onAssign}
          onRemove={onRemove}
          disabled={disabled}
        />
      </div>

      {/* Current Assignments */}
      <EditAssignedList
        restaurants={restaurants}
        selected={selected}
        original={original}
        onRemove={onRemove}
        onOpenDialog={() => setIsDialogOpen(true)}
        disabled={disabled}
      />
    </div>
  )
}
