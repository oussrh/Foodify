'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CredentialsStepProps {
  email: string
  password: string
  onEmail: (value: string) => void
  onPassword: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  error: string
  busy: boolean
  /** What happens after this step, in the portal's own terms; a staff device gets no code. */
  hint: string
  /** A person signs in with an address, a device with the username it was set up with. */
  identifier: 'email' | 'username'
}

/** Step one: email and password. What follows is the portal's to say: a code for a person, nothing for a device. */
export default function CredentialsStep({ email, password, onEmail, onPassword, onSubmit, error, busy, hint, identifier }: CredentialsStepProps) {
  const asUsername = identifier === 'username'
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-display">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{asUsername ? 'Username' : 'Email'}</Label>
        <Input
          id="email"
          type={asUsername ? 'text' : 'email'}
          autoComplete={asUsername ? 'username' : 'email'}
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => onEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => onPassword(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy} className="mt-1">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Checking…' : 'Continue'}
      </Button>
    </form>
  )
}
