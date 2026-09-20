'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { initiateEmailChange } from '@/app/actions/profile-actions'
import { emailChange, type EmailChange } from '@/lib/schemas/user'

const schema = emailChange
type FormValues = EmailChange

export default function ChangeEmailForm({ disabled = false }: { disabled?: boolean }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [notSent, setNotSent] = useState(false)

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    const { sent } = await initiateEmailChange(data.email)
    setLoading(false)
    setNotSent(!sent)
    setSubmitted(sent)
  }

  if (submitted) {
    return <p className="text-sm">Check your current email to confirm.</p>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      {notSent && (
        <p role="alert" className="text-xs text-destructive">
          The confirmation email could not be sent. Try again later.
        </p>
      )}
      <div>
        <Label htmlFor="email">New Email</Label>
        <Input id="email" {...register('email')} disabled={disabled} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" disabled={loading || disabled}>
        Change Email
      </Button>
    </form>
  )
}
