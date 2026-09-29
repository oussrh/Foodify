// components/staff/staff-session-mark.tsx
// Marks the staff session as begun on whichever staff page it begins, so the installed app's launch
// screen (use-launch-screen.ts) belongs to the first load only, even when that load was a shortcut
// or a notification onto a screen that has none. Rendered once, by the staff theme scope.
'use client'

import { useEffect } from 'react'
import { noteStaffSession } from './use-launch-screen'

/** Renders nothing; records the session's start after the first paint of any staff page. */
export function StaffSessionMark() {
  useEffect(() => {
    noteStaffSession()
  }, [])
  return null
}
