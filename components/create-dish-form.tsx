'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createDish } from '@/app/actions/dish-actions'

type Subcategory = { id: string; nameEn: string }

type FormValues = {
  nameEn: string
  nameFr: string
  descriptionEn?: string
  descriptionFr?: string
  price: number
  imageUrl: string
  usdzUrl: string
  glbUrl: string
  subcategoryId?: string
}

const schema: z.ZodType<FormValues> = z.object({
  nameEn: z.string().min(1),
  nameFr: z.string().min(1),
  descriptionEn: z.string().optional(),
  descriptionFr: z.string().optional(),
  price: z.coerce.number().min(0),
  imageUrl: z.string().min(1),
  usdzUrl: z.string().min(1),
  glbUrl: z.string().min(1),
  subcategoryId: z.string().optional(),
})

export default function CreateDishForm({
  restaurantId,
  subcategories,
}: {
  restaurantId: string
  subcategories: Subcategory[]
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    await createDish(restaurantId, {
      ...data,
      subcategoryId: data.subcategoryId || null,
    })
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Label htmlFor="nameEn">Name EN</Label>
      <Input id="nameEn" {...register('nameEn')} />
      {errors.nameEn && (
        <span className="text-sm text-red-500">{errors.nameEn.message}</span>
      )}

      <Label htmlFor="nameFr">Name FR</Label>
      <Input id="nameFr" {...register('nameFr')} />
      {errors.nameFr && (
        <span className="text-sm text-red-500">{errors.nameFr.message}</span>
      )}

      <Label htmlFor="descriptionEn">Description EN</Label>
      <Textarea id="descriptionEn" {...register('descriptionEn')} />

      <Label htmlFor="descriptionFr">Description FR</Label>
      <Textarea id="descriptionFr" {...register('descriptionFr')} />

      <Label htmlFor="price">Price</Label>
      <Input id="price" type="number" step="0.01" {...register('price')} />
      {errors.price && (
        <span className="text-sm text-red-500">{errors.price.message}</span>
      )}

      <Label htmlFor="imageUrl">Image URL</Label>
      <Input id="imageUrl" {...register('imageUrl')} />
      {errors.imageUrl && (
        <span className="text-sm text-red-500">{errors.imageUrl.message}</span>
      )}

      <Label htmlFor="usdzUrl">USDZ URL</Label>
      <Input id="usdzUrl" {...register('usdzUrl')} />
      {errors.usdzUrl && (
        <span className="text-sm text-red-500">{errors.usdzUrl.message}</span>
      )}

      <Label htmlFor="glbUrl">GLB URL</Label>
      <Input id="glbUrl" {...register('glbUrl')} />
      {errors.glbUrl && (
        <span className="text-sm text-red-500">{errors.glbUrl.message}</span>
      )}

      <Label htmlFor="subcategory">Subcategory</Label>
      <select
        id="subcategory"
        {...register('subcategoryId')}
        className="border rounded px-2 py-1"
      >
        <option value="">None</option>
        {subcategories.map((s: Subcategory) => (
          <option key={s.id} value={s.id}>
            {s.nameEn}
          </option>
        ))}
      </select>

      <Button type="submit">Create</Button>
    </form>
  )
}
