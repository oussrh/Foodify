'use client'

import type { Ref } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { otpCode } from '@/lib/schemas/user'

interface CodeStepProps {
  /** Where the code was sent */
  email: string
  code: string
  onCode: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  /** Focused when the step is reached from the credentials step */
  codeRef: Ref<HTMLInputElement>
  error: string
  busy: boolean
  /** Seconds before the code expires */
  timeLeft: number
  /** True until the code is old enough to ask for another */
  resendLocked: boolean
  resending: boolean
  onResend: () => void
  onStartOver: () => void
}

/** Step two: the six-digit code from the email, with its countdown and a way to ask for another. */
export default function CodeStep({ email, code, onCode, onSubmit, codeRef, error, busy, timeLeft, resendLocked, resending, onResend, onStartOver }: CodeStepProps) {
  const mm = Math.floor(timeLeft / 60)
  const ss = (timeLeft % 60).toString().padStart(2, '0')

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-display">Enter your code</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. It expires in{' '}
          <span className="tnum font-medium text-foreground">
            {mm}:{ss}
          </span>
          .
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Code</Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          ref={codeRef}
          value={code}
          onChange={(e) => onCode(e.target.value.replace(/\D/g, ''))}
          className="tnum h-12 text-center text-2xl tracking-[0.4em]"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy || !otpCode.safeParse(code).success} className="mt-1">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? 'Verifying…' : 'Sign in'}
      </Button>
      <div className="flex items-center justify-between text-sm">
        <button type="button" onClick={onStartOver} className="text-muted-foreground hover:text-foreground">
          Use another account
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={resending || resendLocked}
          className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Send a new code'}
        </button>
      </div>
    </form>
  )
}
