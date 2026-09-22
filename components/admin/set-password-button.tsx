// components/admin/set-password-button.tsx
// The "Set password" action on a manager's own page, where there is room for a full-width button
// rather than an icon. The dialog it opens is the same one the row menus use.
'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import ManagerPasswordDialog from '@/components/admin/manager-password-dialog'
import { Button } from '@/components/ui/button'

/** A button and its dialog; the password is typed there, not generated here. */
export default function SetPasswordButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" className="w-full justify-start" onClick={() => setOpen(true)}>
        <KeyRound className="mr-3 h-4 w-4" />
        Set password
      </Button>
      <ManagerPasswordDialog open={open} onOpenChange={setOpen} userId={userId} email={email} />
    </>
  )
}
