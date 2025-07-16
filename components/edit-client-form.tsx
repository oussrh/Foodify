'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClient } from '@/app/actions/client-actions'

type Restaurant = { id: string; name: string }

const schema = z.object({
  email: z.string().email(),
  restaurantIds: z.array(z.string()).optional(),
})

export type EditClientValues = z.infer<typeof schema>

export default function EditClientForm({
  id,
  defaultValues,
  restaurants,
}: {
  id: string
  defaultValues: EditClientValues
  restaurants: Restaurant[]
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditClientValues>({ resolver: zodResolver(schema), defaultValues })

  const onSubmit = async (data: EditClientValues) => {
    await updateClient(id, data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" {...register('email')} />
      {errors.email && (
        <span className="text-sm text-red-500">{errors.email.message}</span>
      )}

      <Label htmlFor="restaurantIds">Restaurants</Label>
      <select multiple id="restaurantIds" {...register('restaurantIds')} className="border rounded px-2 py-1">
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <Button type="submit">Save</Button>
    </form>
  )
}
