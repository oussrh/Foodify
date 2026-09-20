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
}

/** Step one: email and password; a one-time code is emailed after it. */
export default function CredentialsStep({ email, password, onEmail, onPassword, onSubmit, error, busy }: CredentialsStepProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-display">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">We’ll email you a one-time code after this step.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
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
