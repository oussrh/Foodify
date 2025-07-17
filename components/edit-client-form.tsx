// components/edit-client-form.tsx
'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  } = useForm<EditClientValues>({ resolver: zodResolver<EditClientValues>(schema), defaultValues })

  const onSubmit = async (data: EditClientValues) => {
    await updateClient(id, data)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2 w-full max-w-md mx-auto"
    >
      <Label htmlFor="email">Email</Label>
      <Input id="email" {...register('email')} />
      {errors.email && (
        <span className="text-sm text-red-500">{errors.email.message}</span>
      )}

      <Label>Restaurants</Label>
      <div className="flex flex-col gap-1">
        {restaurants.map((r: Restaurant) => (
          <div key={r.id} className="flex items-center gap-2">
            <Checkbox
              id={`restaurant-${r.id}`}
              value={r.id}
              {...register('restaurantIds')}
            />
            <Label htmlFor={`restaurant-${r.id}`} className="font-normal">
              {r.name}
            </Label>
          </div>
        ))}
      </div>

      <Button type="submit">Save</Button>
    </form>
  )
}
