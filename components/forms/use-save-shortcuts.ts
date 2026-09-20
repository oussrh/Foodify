// components/forms/use-save-shortcuts.ts
// An edit form's keyboard: Ctrl+S saves and Escape discards, from anywhere on the page. The
// save it returns is the one the save bar calls too: refused with a toast when nothing changed,
// silently while a save is running.
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export function useSaveShortcuts({
  hasUnsavedChanges,
  isSubmitting,
  submit,
  cancel,
}: {
  hasUnsavedChanges: boolean
  isSubmitting: boolean
  /** Runs the form's submit with its handlers; memoised by the caller. */
  submit: () => void
  /** The discard handler; memoised by the caller. */
  cancel: () => void
}) {
  // Create a submit function that's always up to date
  const submitForm = useCallback(() => {
    if (!hasUnsavedChanges) {
      toast.info('No changes to save')
      return
    }

    if (isSubmitting) {
      return
    }

    submit()
  }, [submit, hasUnsavedChanges, isSubmitting])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        submitForm()
      }
      if (e.key === 'Escape') {
        cancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [submitForm, cancel])

  return submitForm
}
