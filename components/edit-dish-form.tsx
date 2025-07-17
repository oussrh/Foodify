'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateDish } from '@/app/actions/dish-actions'

type Subcategory = { id: string; nameEn: string }

const schema = z.object({
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

export type EditDishValues = z.infer<typeof schema>

export default function EditDishForm({
  id,
  restaurantId,
  defaultValues,
  subcategories,
}: {
  id: string
  restaurantId: string
  defaultValues: EditDishValues
  subcategories: Subcategory[]
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditDishValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const onSubmit = async (data: EditDishValues) => {
    await updateDish(id, restaurantId, {
      ...data,
      subcategoryId: data.subcategoryId || null,
    })
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

      <Button type="submit">Save</Button>
    </form>
  )
}
