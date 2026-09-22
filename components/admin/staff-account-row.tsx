// components/admin/staff-account-row.tsx
// One device in the card's list. Its password field is its own, opened by the button next to the
// name and sitting directly under it: a single field shared by the whole card leaves a reader
// guessing which account a click would hit, and the answer was "whatever you last typed".
'use client'

import { useId, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlainField } from '@/components/forms/plain-field'

interface StaffAccountRowProps {
  account: { id: string; username: string; lastLogin: Date | null }
  busy: boolean
  /** Answers whether it went through, so the row can close itself and say so. */
  onSetPassword: (password: string) => Promise<boolean>
  onRemove: () => void
}

/** A device, what it did last, and the two things that can be done to it: a new password, or removal. */
export function StaffAccountRow({ account, busy, onSetPassword, onRemove }: StaffAccountRowProps) {
  const fieldId = useId()
  const [editing, setEditing] = useState(false)
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!(await onSetPassword(password))) return
    setPassword('')
    setEditing(false)
    setDone(true)
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{account.username}</span>
          <span className="tnum block text-xs text-muted-foreground">
            {account.lastLogin
              ? `Last signed in ${account.lastLogin.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'Never signed in'}
          </span>
        </span>
        {done && !editing && <span className="text-xs font-medium text-success">Password set</span>}
        {!editing && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setDone(false)
              setEditing(true)
            }}
          >
            Set password
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={onRemove} aria-label={`Remove ${account.username}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {editing && (
        <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-2">
          {/* Readable as it is typed: it is being copied onto a device standing on the pass. */}
          <div className="min-w-48 flex-1">
            <PlainField
              id={fieldId}
              label={`New password for ${account.username}`}
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={busy || password.length < 6}>
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      )}
    </li>
  )
}
