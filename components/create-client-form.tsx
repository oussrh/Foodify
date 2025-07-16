'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/app/actions/client-actions'

type Restaurant = { id: string; name: string }

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  restaurantIds: z.array(z.string()).optional(),
  restaurantName: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function CreateClientForm({ restaurants }: { restaurants: Restaurant[] }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    await createClient(data)
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

      <Label htmlFor="restaurantIds">Restaurants</Label>
      <select multiple id="restaurantIds" {...register('restaurantIds')} className="border rounded px-2 py-1">
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <Label htmlFor="restaurantName">New Restaurant Name</Label>
      <Input id="restaurantName" {...register('restaurantName')} />

      <Button type="submit">Create</Button>
    </form>
  )
}
