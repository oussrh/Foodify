'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updatePassword } from '@/app/actions/profile-actions'

const schema = z
  .object({
    password: z.string().min(6),
    confirm: z.string().min(6),
  })
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    await updatePassword(data.password)
    setLoading(false)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div>
        <Label htmlFor="password">New Password</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div>
        <Label htmlFor="confirm">Confirm Password</Label>
        <Input id="confirm" type="password" {...register('confirm')} />
        {errors.confirm && (
          <p className="text-xs text-destructive">{errors.confirm.message}</p>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        Change Password
      </Button>
    </form>
  )
}
