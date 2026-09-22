// components/password-form/password-requirements.tsx
// The five rules a new password must pass (the same as lib/schemas/user's passwordChange),
// listed under the field as it is typed: a check for each rule met, a dot for each not yet.
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PasswordCheck = { label: string; test: boolean }

export function passwordChecks(password: string): PasswordCheck[] {
  return [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'One uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', test: /[a-z]/.test(password) },
    { label: 'One number', test: /[0-9]/.test(password) },
    { label: 'One special character', test: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function PasswordRequirements({ password }: { password: string }) {
  const checks = passwordChecks(password)
  return (
    <ul className="grid gap-1 pt-1 sm:grid-cols-2">
      {checks.map((check) => (
        <li key={check.label} className={cn('flex items-center gap-2 text-xs', check.test ? 'text-success' : 'text-muted-foreground')}>
          {check.test ? (
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <span className="mx-[5px] h-1 w-1 rounded-full bg-current" aria-hidden="true" />
          )}
          {check.label}
          <span className="sr-only">{check.test ? ' (met)' : ' (not yet)'}</span>
        </li>
      ))}
    </ul>
  )
}
