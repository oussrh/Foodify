// components/admin/manager-password-dialog.tsx
// Setting a manager's password, from the restaurant's People tab or from the platform-wide list.
// The password is typed here and handed over: what stood here before sent the same literal for
// every manager and then announced it in an alert box, which meant every account reset that way
// shared one password that anybody who had ever seen the box could use.
'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { resetClientPassword } from '@/app/actions/client-actions'
import { resetManagerPassword } from '@/app/actions/restaurant-manager-actions'
import { FormDialog } from '@/components/forms/form-dialog'
import { PlainField } from '@/components/forms/plain-field'

interface ManagerPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  email: string
  /**
   * Set when this is opened from one restaurant's People tab: the reset is scoped to it, and is
   * refused for a manager who also runs another restaurant. Left out on the platform-wide list,
   * where a super admin is the only caller.
   */
  restaurantId?: string
}

/** Controlled: the row that opens it owns the open state, so a dropdown closing cannot unmount it. */
export default function ManagerPasswordDialog({
  open,
  onOpenChange,
  userId,
  email,
  restaurantId,
}: ManagerPasswordDialogProps) {
  const router = useRouter()
  const field = useId()
  const [next, setNext] = useState('')

  const set = async () => {
    await (restaurantId ? resetManagerPassword(restaurantId, userId, next) : resetClientPassword(userId, next))
    setNext('')
    toast.success(`New password set for ${email}`)
    router.refresh()
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Set a new password"
      description={`It replaces the one ${email} uses now, straight away. Tell them what it is, and ask them to change it from Account settings.`}
      submitLabel="Set password"
      canSubmit={next.length >= 6}
      onSubmit={set}
      failure="Could not set that password. Someone who manages other restaurants too can only be reset by a Foodify administrator."
    >
      <PlainField
        id={`${field}-password`}
        label="New password"
        value={next}
        onChange={setNext}
        placeholder="At least 6 characters"
        required
      />
    </FormDialog>
  )
}
