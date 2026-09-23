// components/update-password-form.tsx
// The signed-in user's password change, shared by both portals' account pages: the current
// password, the new one with its requirements listed as it is typed, its confirmation, one
// button. The outcome is said in place; the fields are cleared once the change is stored.
'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updatePassword } from '@/app/actions/profile-actions'
import { passwordChange } from '@/lib/schemas/user'
import PasswordField from '@/components/password-form/password-field'
import { PasswordRequirements } from '@/components/password-form/password-requirements'
import { Button } from '@/components/ui/button'

const schema = passwordChange
  .extend({ confirm: z.string().min(1, 'Please confirm your new password') })
  .refine((data) => data.password === data.confirm, {
    path: ['confirm'],
    message: 'The two passwords do not match',
  })

type FormValues = z.infer<typeof schema>
type Status = 'idle' | 'saving' | 'saved' | 'failed'

/**
 * The signed-in user's password change for both portals' Account pages: checks the current password
 * server-side, says the result in place and clears the fields on success.
 */
export default function UpdatePasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { currentPassword: '', password: '', confirm: '' } })
  const [status, setStatus] = useState<Status>('idle')
  const password = useWatch({ control, name: 'password' }) || ''

  const onSubmit = async (data: FormValues) => {
    setStatus('saving')
    try {
      await updatePassword({ currentPassword: data.currentPassword, password: data.password })
      setStatus('saved')
      reset()
    } catch {
      setStatus('failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <PasswordField id="currentPassword" label="Current password" autoComplete="current-password" field={register('currentPassword')} error={errors.currentPassword} />
      <PasswordField id="password" label="New password" autoComplete="new-password" field={register('password')} error={errors.password}>
        {password && <PasswordRequirements password={password} />}
      </PasswordField>
      <PasswordField id="confirm" label="Confirm new password" autoComplete="new-password" field={register('confirm')} error={errors.confirm} />

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
          {status === 'saved' ? 'Password updated.' : ''}
        </p>
        {status === 'failed' && (
          <p role="alert" className="text-sm text-destructive">
            Could not update it. Check your current password and try again.
          </p>
        )}
        <Button type="submit" disabled={status === 'saving'}>
          {status === 'saving' ? 'Updating…' : 'Update password'}
        </Button>
      </div>
    </form>
  )
}
