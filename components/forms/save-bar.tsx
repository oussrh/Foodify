// components/forms/save-bar.tsx
// The sticky bar an edit form shows while there is something to save: the state sentence,
// Discard and Save. Rendered only while the form is dirty, saving or failed.
'use client'

import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/**
 * The sticky Discard/Save bar of an edit form; it renders itself only while the form is dirty,
 * saving, or its last save failed, so a caller mounts it unconditionally.
 */
export default function SaveBar({
  saveStatus,
  hasUnsavedChanges,
  isSubmitting,
  onDiscard,
  onSave,
  className,
}: {
  saveStatus: SaveStatus
  hasUnsavedChanges: boolean
  isSubmitting: boolean
  onDiscard: () => void
  onSave: () => void
  /** Extra positioning classes, placed between the sticky offset and the layout classes. */
  className?: string
}) {
  if (!(hasUnsavedChanges || saveStatus === 'saving' || saveStatus === 'error')) return null
  return (
    <div className={cn('sticky bottom-[72px] z-40', className, 'flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sheet md:bottom-4')}>
      <p className="text-sm text-muted-foreground">
        {saveStatus === 'error' ? 'Could not save. Check the fields and try again.' : saveStatus === 'saving' ? 'Saving…' : 'You have unsaved changes.'}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" onClick={onDiscard} disabled={isSubmitting}>
          Discard
        </Button>
        <Button type="button" onClick={onSave} disabled={isSubmitting}>
          {saveStatus === 'saving' ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
