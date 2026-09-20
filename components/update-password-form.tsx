// PathFile: components/update-password-form.tsx
'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { updatePassword } from '@/app/actions/profile-actions'
import { passwordChange } from '@/lib/schemas/user'
import PasswordField from '@/components/password-form/password-field'
import ConfirmPasswordField from '@/components/password-form/confirm-password-field'
import { passwordChecks, PasswordStrengthIndicator } from '@/components/password-form/password-strength'
import PasswordSubmit from '@/components/password-form/password-submit'
import SecurityTips from '@/components/password-form/security-tips'
import {
  Lock,
  AlertCircle,
  Shield,
  KeyRound,
  CheckCircle2,
} from 'lucide-react'

const schema = passwordChange
  .extend({ confirm: z.string().min(1, 'Please confirm your password') })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match',
  })

type FormValues = z.infer<typeof schema>

export default function UpdatePasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const password = useWatch({ control, name: 'password' }) || ''
  const confirmPassword = useWatch({ control, name: 'confirm' }) || ''

  const checks = passwordChecks(password)
  const strengthScore = checks.filter(check => check.test).length

  const passwordsMatch = password && confirmPassword && password === confirmPassword

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await updatePassword({ currentPassword: data.currentPassword, password: data.password })
      setSuccess(true)
      reset()
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError('Failed to update password. Please check your current password and try again.')
      console.error('Password update error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 rounded-lg flex items-center justify-center">
          <KeyRound className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Update Password</h2>
          <p className="text-muted-foreground">Keep your account secure with a strong password</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 border border-border rounded-md flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Password updated successfully!</p>
            <p className="text-xs text-success mt-1">Your account is now more secure and protected</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 border border-border rounded-md flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-destructive mt-1">Please verify your information and try again</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Password */}
        <PasswordField
          id="currentPassword"
          label="Current Password"
          icon={<Lock className="h-4 w-4 text-muted-foreground" />}
          field={register('currentPassword')}
          placeholder="Enter your current password"
          error={errors.currentPassword}
        />

        {/* New Password */}
        <PasswordField
          id="password"
          label="New Password"
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
          field={register('password')}
          placeholder="Enter your new password"
          error={errors.password}
        >
          {/* Password Strength Indicator */}
          {password && <PasswordStrengthIndicator checks={checks} score={strengthScore} />}
        </PasswordField>

        {/* Confirm Password */}
        <ConfirmPasswordField field={register('confirm')} error={errors.confirm} confirmPassword={confirmPassword} passwordsMatch={passwordsMatch} />

        {/* Submit Button */}
        <PasswordSubmit loading={loading} strengthScore={strengthScore} password={password} confirmPassword={confirmPassword} passwordsMatch={passwordsMatch} />
      </form>

      {/* Security Tips */}
      <SecurityTips />
    </div>
  )
}
