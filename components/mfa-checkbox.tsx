// components/mfa-checkbox.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setMfaEnabled } from '@/app/actions/profile-actions'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface MfaCheckboxProps {
  /** The stored choice, read by the page. */
  enabled: boolean
}

type Status = 'idle' | 'saving' | 'saved' | 'failed'

const STATUS_TEXT: Record<Status, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved.',
  failed: '',
}

/**
 * The account's second-factor switch, shared by both portals: one checkbox that saves the moment it is ticked or
 * cleared. A failed save puts the box back and says so; a saved one refreshes the page so what else reads the flag agrees.
 */
export default function MfaCheckbox({ enabled }: MfaCheckboxProps) {
  const router = useRouter()
  const [checked, setChecked] = useState(enabled)
  const [status, setStatus] = useState<Status>('idle')

  const toggle = async (next: boolean) => {
    const previous = checked
    setChecked(next)
    setStatus('saving')
    try {
      const saved = await setMfaEnabled({ mfaEnabled: next })
      setChecked(saved.mfaEnabled)
      setStatus('saved')
      router.refresh()
    } catch {
      setChecked(previous)
      setStatus('failed')
    }
  }

  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id="mfa-enabled"
        checked={checked}
        disabled={status === 'saving'}
        onCheckedChange={(value) => toggle(value === true)}
        aria-describedby="mfa-enabled-description"
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <Label htmlFor="mfa-enabled" className="cursor-pointer">
          Ask for an emailed code at every sign-in
        </Label>
        <p id="mfa-enabled-description" className="text-sm text-muted-foreground">
          On, a six-digit code is emailed to you after your password, valid for ten minutes. Off, your password alone signs you in.
        </p>
        {/* The outcome: progress in a polite region, a failure as an alert (it is inserted, so it is read). */}
        <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
          {STATUS_TEXT[status]}
        </p>
        {status === 'failed' && (
          <p role="alert" className="text-xs text-destructive">
            Could not save. Try again.
          </p>
        )}
      </div>
    </div>
  )
}
