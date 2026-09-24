// components/admin/staff-accounts.tsx
// The accounts of one restaurant that are not people with portals: the order tablet on the pass
// and the waiter on the floor. Neither has a mailbox, so neither has an address: they sign in
// with a username, and the password is set here, in the open, while it is being typed into the
// device — each row carries its own field, so a password is never set on the wrong account.
// One card serves both roles; which one it makes is the role it is given.
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tablet, Utensils } from 'lucide-react'
import { createStaffUser, deleteStaffUser, resetStaffPassword } from '@/app/actions/staff-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StaffAccountRow } from '@/components/admin/staff-account-row'
import { PlainField } from '@/components/forms/plain-field'
import { fieldIssues } from '@/components/forms/schema-check'
import { ROLE_DESCRIPTION, ROLE_LABEL } from '@/lib/roles'
import { staffAccount, type StaffRole } from '@/lib/schemas/staff'

interface StaffAccountRow {
  id: string
  /** The name the device signs in with; there is no address to show. */
  username: string
  lastLogin: Date | null
}

interface StaffAccountsProps {
  restaurantId: string
  /** Named `staffRole` rather than `role`: on a JSX element `role` is the ARIA attribute. */
  staffRole: StaffRole
  accounts: StaffAccountRow[]
  /** Where this kind of account signs in, shown so it can be typed into the device. */
  loginUrl: string
}

/**
 * One card of a restaurant's device accounts (order tablets or waiters): each signs in with a
 * username, and its password is set on its own row.
 */
export default function StaffAccounts({ restaurantId, staffRole: role, accounts, loginUrl }: StaffAccountsProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [issues, setIssues] = useState<Record<string, string>>({})
  const label = ROLE_LABEL[role]
  const Icon = role === 'KITCHEN' ? Tablet : Utensils

  /** Answers whether the work went through, so a row can close its own field on success. */
  const run = async (work: () => Promise<unknown>, failure: string) => {
    setBusy(true)
    setError('')
    try {
      await work()
      router.refresh()
      return true
    } catch {
      setError(failure)
      return false
    } finally {
      setBusy(false)
    }
  }

  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    // The schema createStaffUser parses: the username's characters and length, the password's length.
    const found = fieldIssues(staffAccount, { username, password })
    setIssues(found)
    if (Object.keys(found).length > 0) return
    await run(async () => {
      await createStaffUser(restaurantId, role, { username, password })
      setUsername('')
      setPassword('')
    }, 'Could not create it. The username may be taken.')
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}s
        </CardTitle>
        <CardDescription>
          {ROLE_DESCRIPTION[role]} Signs in at <code className="font-mono text-xs">{loginUrl}</code>, never asks for a code, and stays
          signed in for a month.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-5">
        {accounts.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border">
            {accounts.map((account) => (
              <StaffAccountRow
                key={account.id}
                account={account}
                busy={busy}
                onSetPassword={(next) => run(() => resetStaffPassword(account.id, next), 'Could not set that password.')}
                onRemove={() => run(() => deleteStaffUser(account.id), 'Could not remove it.')}
              />
            ))}
          </ul>
        )}

        <form onSubmit={create} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <PlainField
            id={`${role}-username`}
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder={role === 'KITCHEN' ? 'kitchen1' : 'waiter1'}
            required
            error={issues.username}
          />
          <PlainField
            id={`${role}-password`}
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="At least 6 characters"
            required
            error={issues.password}
          />
          <Button type="submit" disabled={busy || !username.trim() || !password}>
            Add {label.toLowerCase()}
          </Button>
        </form>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
