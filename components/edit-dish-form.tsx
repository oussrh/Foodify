'use client'

import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateDish } from '@/app/actions/dish-actions'
import { dishInput } from '@/lib/schemas/dish'
import { DishNameFields, DishDescriptionFields } from '@/components/dish-form/dish-fields'
import DishDetailsGrid from '@/components/dish-form/dish-details-grid'
import DishMediaUploads from '@/components/dish-form/dish-media-uploads'
import DishModelPreview from '@/components/dish-form/dish-model-preview'
import { useDishAssets } from '@/components/dish-form/use-dish-assets'
import SaveBar, { type SaveStatus } from '@/components/forms/save-bar'
import { useSaveShortcuts } from '@/components/forms/use-save-shortcuts'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Edit } from 'lucide-react'

type Subcategory = { id: string; nameEn: string }

/** The edit form's values as the schema below reads them: an optional member may be absent or `undefined`. */
export interface EditDishValues {
  nameEn: string
  nameFr: string
  descriptionEn?: string | undefined
  descriptionFr?: string | undefined
  price: string
  imageUrl: string
  usdzUrl?: string | undefined
  glbUrl?: string | undefined
  subcategoryId?: string | undefined
  calories?: number | undefined
  isMostPurchased?: boolean | undefined
  dietary?: string[] | undefined
  allergens?: string[] | undefined
}

/**
 * The calories box as the schema reads it: empty is no figure, not NaN. `valueAsNumber` turned an
 * empty box into NaN, which the schema refused, so a dish saved without calories could never be
 * edited again — the save failed with focus on a field that showed nothing wrong.
 */
const caloriesValue = (raw: unknown) => (raw === '' || raw === null || raw === undefined ? undefined : Number(raw))

const schema = dishInput.omit({ subcategoryId: true, calories: true }).extend({
  subcategoryId: z.string().optional(),
  calories: z.number().int('Calories must be a whole number').optional(),
}).transform((data) => ({
  ...data,
  calories: data.calories ? Number(data.calories) : undefined,
}))

/**
 * Edits an existing dish behind the sticky save bar and the save shortcuts; a save refreshes the
 * route, and new defaults from the server reset both the fields and the uploaded assets.
 */
export default function EditDishForm({
  id,
  defaultValues,
  subcategories,
  restaurantName,
  dietaryOptions,
}: {
  id: string
  defaultValues: EditDishValues
  subcategories: Subcategory[]
  restaurantName?: string
  /** The restaurant's dietary options (Settings → General): what the picker offers. */
  dietaryOptions: readonly string[]
}) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const assets = useDishAssets(defaultValues)
  const { imageUrl, usdzUrl, glbUrl, resetAssets } = assets
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    control,
    setValue,
    reset,
  } = useForm<EditDishValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  })
  const [dietary = [], allergens = [], nameEn] = useWatch({ control, name: ['dietary', 'allergens', 'nameEn'] })

  const hasUnsavedChanges = isDirty

  // New defaults (after a save the page re-renders with fresh data): the asset fields follow
  // them during this render, the form resets after it.
  const [prevDefaults, setPrevDefaults] = useState(defaultValues)
  if (prevDefaults !== defaultValues) {
    setPrevDefaults(defaultValues)
    resetAssets(defaultValues)
  }
  useEffect(() => {
    reset(defaultValues)
  }, [defaultValues, reset])

  // Handle save
  const onSubmit = useCallback(async (data: EditDishValues) => {
    try {
      setSaveStatus('saving')
      toast.loading('Saving dish...', { id: 'dish-save' })

      const finalData = {
        ...data,
        imageUrl,
        subcategoryId: data.subcategoryId || null,
        usdzUrl: usdzUrl || '',
        glbUrl: glbUrl || '',
      }

      await updateDish(id, finalData)

      setSaveStatus('saved')

      // Reset form state to mark as clean
      reset(data)

      toast.success('Dish saved successfully!', {
        id: 'dish-save',
        description: 'All changes have been saved.'
      })

      router.refresh() // Refresh the page to get updated data

      // Show saved status briefly
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Dish update error:', error)
      setSaveStatus('error')

      toast.error('Failed to save dish', {
        id: 'dish-save',
        description: error instanceof Error ? error.message : 'Please try again.'
      })

      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [id, imageUrl, usdzUrl, glbUrl, reset, router])

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        reset(defaultValues)
        setSaveStatus('idle')
        resetAssets(defaultValues)
      }
    }
  }, [hasUnsavedChanges, reset, defaultValues, resetAssets])

  // A refused save says so in the save bar rather than leaving "You have unsaved changes" up, as
  // if nothing had been tried: the calories bug failed exactly that silently.
  const onInvalid = useCallback(() => setSaveStatus('error'), [])
  const submit = useCallback(() => {
    handleSubmit(onSubmit, onInvalid)()
  }, [handleSubmit, onSubmit, onInvalid])
  const submitForm = useSaveShortcuts({ hasUnsavedChanges, isSubmitting, submit, cancel: handleCancel })

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
        {/* Basic Information */}
        <Card className="border-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-muted-foreground" />
              Edit Dish Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Names */}
            <DishNameFields nameEn={register('nameEn')} nameFr={register('nameFr')} errors={errors} disabled={isSubmitting} />

            {/* Descriptions */}
            <DishDescriptionFields descriptionEn={register('descriptionEn')} descriptionFr={register('descriptionFr')} disabled={isSubmitting} />

            <DishDetailsGrid
              price={{ field: register('price'), error: errors.price }}
              calories={{ field: register('calories', { setValueAs: caloriesValue }) }}
              subcategoryId={register('subcategoryId')}
              imageUrl={{ field: register('imageUrl'), value: imageUrl }}
              isMostPurchased={register('isMostPurchased')}
              subcategories={subcategories}
              tags={{ dietaryOptions, dietary, allergens, onDietaryChange: (v) => setValue('dietary', v, { shouldDirty: true }), onAllergensChange: (v) => setValue('allergens', v, { shouldDirty: true }) }}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        <DishMediaUploads restaurantName={restaurantName} assets={assets} onImageUrl={(url) => setValue('imageUrl', url, { shouldDirty: true })} />

        {/* Save bar: only when there is something to save */}
        <SaveBar saveStatus={saveStatus} hasUnsavedChanges={hasUnsavedChanges} isSubmitting={isSubmitting} onDiscard={handleCancel} onSave={submitForm} />
      </form>

      <DishModelPreview assets={assets} dishName={nameEn} />
    </div>
  )
}
