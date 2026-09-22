// components/admin/manager-row-actions.tsx
// The two things one restaurant can do to a manager other than itself: give them a new password,
// or take their access to this restaurant away. Removing touches nothing but this restaurant —
// the account, and every other restaurant it manages, is left as it was.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { removeRestaurantManager } from '@/app/actions/restaurant-manager-actions'
import ManagerPasswordDialog from '@/components/admin/manager-password-dialog'
import { Button } from '@/components/ui/button'

/** Rendered on every manager row but the reader's own; your own access is not yours to remove. */
export default function ManagerRowActions({
  restaurantId,
  userId,
  email,
}: {
  restaurantId: string
  userId: string
  email: string
}) {
  const router = useRouter()
  const [password, setPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      await removeRestaurantManager(restaurantId, userId)
      router.refresh()
    } catch {
      toast.error('Could not remove that manager.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Button size="sm" variant="ghost" onClick={() => setPassword(true)} aria-label={`Set a new password for ${email}`}>
        <KeyRound className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={remove} aria-label={`Remove ${email}`}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <ManagerPasswordDialog
        open={password}
        onOpenChange={setPassword}
        userId={userId}
        email={email}
        restaurantId={restaurantId}
      />
    </div>
  )
}
