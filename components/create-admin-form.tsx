'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createAdmin } from '@/app/actions/admin-user-actions'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

export default function CreateAdminForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver<FormValues>(schema) })

  const onSubmit = async (data: FormValues) => {
    await createAdmin(data)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" {...register('email')} />
      {errors.email && (
        <span className="text-sm text-red-500">{errors.email.message}</span>
      )}

      <Label htmlFor="password">Password</Label>
      <Input id="password" type="password" {...register('password')} />
      {errors.password && (
        <span className="text-sm text-red-500">{errors.password.message}</span>
      )}

      <Button type="submit">Create</Button>
    </form>
  )
}
