// components/client-form/edit-client-submit.tsx
// The foot of the edit-administrator form: the unsaved-changes note, the Save button with its
// busy state, and the summary of what the save will change.
'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowRight, Loader2, Save } from 'lucide-react'
import type { AssignmentChanges } from './edit-assign-dialog'

export default function EditClientSubmit({
  isDirty,
  isSubmitting,
  changes,
  hasEmailChanged,
}: {
  isDirty: boolean
  isSubmitting: boolean
  changes: AssignmentChanges
  hasEmailChanged: boolean
}) {
  return (
    <div className="pt-6 border-t border-border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDirty && (
            <div className="flex items-center gap-2 text-warning dark:text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">You have unsaved changes</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="h-12 px-8 disabled:opacity-50 text-white font-semibold rounded-md transition-colors transform hover:scale-[1.02] disabled:"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Updating User...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Save className="h-5 w-5" />
              <span>Save Changes</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>
      </div>

      {/* Change Summary */}
      {isDirty && (changes.added.length > 0 || changes.removed.length > 0 || hasEmailChanged) && (
        <div className="p-4 bg-muted border border-border rounded-md">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Summary of Changes</h4>
          <div className="space-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
            {hasEmailChanged && (
              <p>• Email address will be updated</p>
            )}
            {changes.added.length > 0 && (
              <p>• {changes.added.length} restaurant(s) will be added</p>
            )}
            {changes.removed.length > 0 && (
              <p>• {changes.removed.length} restaurant(s) will be removed</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
