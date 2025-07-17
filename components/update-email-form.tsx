'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateEmail } from '@/app/actions/profile-actions'

const schema = z.object({
  email: z.string().email(),
})

type FormValues = z.infer<typeof schema>

export default function UpdateEmailForm({
  defaultEmail,
}: {
  defaultEmail: string
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver<FormValues>(schema),
    defaultValues: { email: defaultEmail },
  })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    await updateEmail(data.email)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" {...register('email')} />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        Save Email
      </Button>
    </form>
  )
}
