'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAdmin } from '@/app/actions/admin-user-actions'

const schema = z.object({
  email: z.string().email(),
})

export type EditAdminValues = z.infer<typeof schema>

export default function EditAdminForm({
  id,
  defaultValues,
}: {
  id: string
  defaultValues: EditAdminValues
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditAdminValues>({ resolver: zodResolver(schema), defaultValues })

  const onSubmit = async (data: EditAdminValues) => {
    await updateAdmin(id, data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" {...register('email')} />
      {errors.email && (
        <span className="text-sm text-red-500">{errors.email.message}</span>
      )}

      <Button type="submit">Save</Button>
    </form>
  )
}
