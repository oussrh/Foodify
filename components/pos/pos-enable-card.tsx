// components/pos/pos-enable-card.tsx
// The super admin's switch on the Integrations tab: whether this restaurant may connect a POS.
// Only the admin portal renders it; the action refuses anyone else all the same.
'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setPosEnabled } from '@/app/actions/pos-admin-actions'
import { Card, CardContent } from '@/components/ui/card'

/** A checkbox that switches POS integration on or off for one restaurant, saved as soon as it changes. */
export function PosEnableCard({ restaurantId, enabled }: { restaurantId: string; enabled: boolean }) {
  const id = useId()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  // Shown as asked at once, and put back if the save is refused.
  const [on, setOn] = useState(enabled)

  const change = async (next: boolean) => {
    setBusy(true)
    setOn(next)
    try {
      await setPosEnabled(restaurantId, { enabled: next })
      toast.success(next ? 'POS integration switched on' : 'POS integration switched off')
      router.refresh()
    } catch {
      setOn(!next)
      toast.error('Could not change it. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex min-h-12 items-center gap-3">
          <input id={id} type="checkbox" className="h-6 w-6 shrink-0 accent-primary" checked={on} disabled={busy} onChange={(event) => void change(event.target.checked)} aria-describedby={`${id}-help`} />
          <div>
            <label htmlFor={id} className="block cursor-pointer font-medium">
              Include POS integration
            </label>
            <p id={`${id}-help`} className="text-sm text-muted-foreground">
              Super admin only. Lets this restaurant’s owner connect a POS; off, nothing is sent to it.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
