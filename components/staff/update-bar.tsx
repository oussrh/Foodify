// components/staff/update-bar.tsx
// The line under a staff app's header when a new version is waiting: it names the app, offers one
// Restart, and otherwise stays out of the way. It never restarts by itself, because the moment a
// version lands is rarely a moment the kitchen or the floor can spare (use-staff-update.ts).
'use client'

import { RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STAFF_APP_IDENTITY, type StaffBrandApp } from '@/lib/staff-apps'
import { useStaffUpdate } from './use-staff-update'

/** "A new version of Foodizar Kitchen is ready", with the Restart that switches to it; nothing when none waits. */
export function UpdateBar({ app }: { app: StaffBrandApp }) {
  const update = useStaffUpdate()
  if (!update.waiting) return null

  return (
    <div role="status" className="flex items-center gap-3 border-t border-border bg-muted px-3 py-1">
      <p className="min-w-0 flex-1 text-sm">A new version of {STAFF_APP_IDENTITY[app].name} is ready</p>
      <Button variant="outline" className="h-12 px-4" onClick={update.restart}>
        <RotateCw className="h-5 w-5" aria-hidden="true" />
        Restart
      </Button>
    </div>
  )
}
