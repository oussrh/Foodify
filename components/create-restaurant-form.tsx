'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createRestaurant } from '@/app/actions/restaurant-actions'

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().optional(),
  colorTheme: z.string().optional(),
  defaultLocale: z.enum(['en', 'fr']).default('en'),
})

type FormValues = z.infer<typeof schema>

export default function CreateRestaurantForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { defaultLocale: 'en' } })

  const onSubmit = async (data: FormValues) => {
    await createRestaurant(data)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Label htmlFor="name">Name</Label>
      <Input id="name" {...register('name')} />
      {errors.name && <span className="text-sm text-red-500">{errors.name.message}</span>}

      <Label htmlFor="slug">Slug</Label>
      <Input id="slug" {...register('slug')} />
      {errors.slug && <span className="text-sm text-red-500">{errors.slug.message}</span>}

      <Label htmlFor="email">Email</Label>
      <Input id="email" {...register('email')} />
      {errors.email && <span className="text-sm text-red-500">{errors.email.message}</span>}

      <Label htmlFor="phone">Phone</Label>
      <Input id="phone" {...register('phone')} />

      <Label htmlFor="tagline">Tagline</Label>
      <Input id="tagline" {...register('tagline')} />

      <Label htmlFor="logoUrl">Logo URL</Label>
      <Input id="logoUrl" {...register('logoUrl')} />

      <Label htmlFor="colorTheme">Color Theme</Label>
      <Input id="colorTheme" type="color" {...register('colorTheme')} />

      <Label htmlFor="defaultLocale">Default Locale</Label>
      <select id="defaultLocale" {...register('defaultLocale')} className="border rounded px-2 py-1">
        <option value="en">English</option>
        <option value="fr">French</option>
      </select>

      <Button type="submit">Create</Button>
    </form>
  )
}
