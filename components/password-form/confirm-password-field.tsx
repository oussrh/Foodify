// components/password-form/confirm-password-field.tsx
// The confirmation input of the update-password form: the show/hide toggle beside a check
// mark once both passwords match, the error line, and the "match" line.
'use client'

import { useState } from 'react'
import type { FieldError as FieldErrorShape, UseFormRegisterReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react'

export default function ConfirmPasswordField({
  field,
  error,
  confirmPassword,
  passwordsMatch,
}: {
  field: UseFormRegisterReturn
  error?: FieldErrorShape | undefined
  /** The confirmation as typed. */
  confirmPassword: string
  /** Both typed and equal (the form's `password && confirm && password === confirm`). */
  passwordsMatch: string | boolean
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="space-y-3">
      <Label htmlFor="confirm" className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Shield className="h-4 w-4 text-muted-foreground" />
        Confirm New Password
      </Label>
      <div className="relative group">
        <Input
          id="confirm"
          type={show ? 'text' : 'password'}
          {...field}
          className="pl-4 pr-12 h-12 border-2 focus:ring-4 rounded-md transition-colors group-hover:border-border border-border focus:border-border-strong"
          placeholder="Confirm your new password"
        />
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {confirmPassword && passwordsMatch && (
            <CheckCircle className="h-4 w-4 text-success" aria-label="Passwords match" role="img" />
          )}
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="text-muted-foreground hover:text-muted-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          >
            {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}
      {confirmPassword && passwordsMatch && !error && (
        <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
          <CheckCircle className="h-4 w-4 text-success shrink-0" />
          <p className="text-sm text-success font-medium">Passwords match perfectly!</p>
        </div>
      )}
    </div>
  )
}
