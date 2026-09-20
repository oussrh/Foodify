// components/forms/use-unsaved-changes-warning.ts
// The browser's leave-page prompt while a form has unsaved changes.
import { useEffect } from 'react'

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  // Warn about unsaved changes on page leave
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])
}
