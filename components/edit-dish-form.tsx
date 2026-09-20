'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DietarySelect from '@/components/dietary-select'
import { updateDish } from '@/app/actions/dish-actions'
import ARFileUpload from '@/components/ar-file-upload'
import ARModelPreview from '@/components/ar-model-preview'
import ImageUpload from '@/components/image-upload'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Globe,
  DollarSign,
  Save,
  Utensils,
  Edit,
} from 'lucide-react'

type Subcategory = { id: string; nameEn: string }

export interface EditDishValues {
  nameEn: string
  nameFr: string
  descriptionEn?: string
  descriptionFr?: string
  price: number
  imageUrl: string
  usdzUrl?: string
  glbUrl?: string
  subcategoryId?: string
  calories?: number
  isMostPurchased?: boolean
  dietary?: string[]
  allergens?: string[]
}

const schema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameFr: z.string().min(1, "French name is required"),
  descriptionEn: z.string().optional(),
  descriptionFr: z.string().optional(),
  price: z.number().min(0, "Price must be greater than 0"),
  imageUrl: z.string().min(1, "Image URL is required"),
  usdzUrl: z.string().optional(),
  glbUrl: z.string().optional(),
  subcategoryId: z.string().optional(),
  calories: z.number().optional(),
  isMostPurchased: z.boolean().optional(),
  dietary: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
}).transform((data) => ({
  ...data,
  price: Number(data.price),
  calories: data.calories ? Number(data.calories) : undefined,
}))

export default function EditDishForm({
  id,
  restaurantId,
  defaultValues,
  subcategories,
  restaurantName,
}: {
  id: string
  restaurantId: string
  defaultValues: EditDishValues
  subcategories: Subcategory[]
  restaurantName?: string
}) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [usdzUrl, setUsdzUrl] = useState(defaultValues.usdzUrl || '')
  const [glbUrl, setGlbUrl] = useState(defaultValues.glbUrl || '')
  const [imageUrl, setImageUrl] = useState(defaultValues.imageUrl || '')
  const [previewModel, setPreviewModel] = useState<{url: string, type: 'usdz' | 'glb'} | null>(null)
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<EditDishValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange'
  })

  // Track form changes
  useEffect(() => {
    setHasUnsavedChanges(isDirty)
  }, [isDirty])

  // Update state when defaultValues change (after database updates)
  useEffect(() => {
    setUsdzUrl(defaultValues.usdzUrl || '')
    setGlbUrl(defaultValues.glbUrl || '')
    setImageUrl(defaultValues.imageUrl || '')
    reset(defaultValues) // Reset the entire form with new default values
  }, [defaultValues, reset])

  // Handle save
  const onSubmit = useCallback(async (data: EditDishValues) => {
    try {
      setSaveStatus('saving')
      toast.loading('Saving dish...', { id: 'dish-save' })
      
      const finalData = {
        ...data,
        imageUrl: imageUrl || data.imageUrl,
        subcategoryId: data.subcategoryId || null,
        usdzUrl: usdzUrl || '',
        glbUrl: glbUrl || '',
      }
      
      console.log('Form submission data:', {
        formData: data,
        usdzUrl,
        glbUrl,
        imageUrl,
        finalData
      })
      
      await updateDish(id, restaurantId, finalData)
      
      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      
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
  }, [id, restaurantId, imageUrl, usdzUrl, glbUrl, reset, router])
  
  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        reset(defaultValues)
        setHasUnsavedChanges(false)
        setSaveStatus('idle')
        setUsdzUrl(defaultValues.usdzUrl || '')
        setGlbUrl(defaultValues.glbUrl || '')
        setImageUrl(defaultValues.imageUrl || '')
      }
    }
  }, [hasUnsavedChanges, reset, defaultValues])
  
  // Create a submit function that's always up to date
  const submitForm = useCallback(() => {
    if (!hasUnsavedChanges) {
      toast.info('No changes to save')
      return
    }
    
    if (isSubmitting) {
      return
    }
    
    handleSubmit(onSubmit)()
  }, [handleSubmit, onSubmit, hasUnsavedChanges, isSubmitting])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        submitForm()
      }
      if (e.key === 'Escape') {
        handleCancel()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [submitForm, handleCancel])

  const handlePreview = (modelUrl: string, modelType: 'usdz' | 'glb') => {
    setPreviewModel({ url: modelUrl, type: modelType })
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nameEn" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  English Name
                </Label>
                <Input 
                  id="nameEn" 
                  {...register('nameEn')} 
                  className="border-border focus:border-border-strong"
                  disabled={isSubmitting}
                />
                {errors.nameEn && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {errors.nameEn.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nameFr" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  French Name
                </Label>
                <Input 
                  id="nameFr" 
                  {...register('nameFr')} 
                  className="border-border focus:border-border-strong"
                  disabled={isSubmitting}
                />
                {errors.nameFr && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {errors.nameFr.message}
                  </p>
                )}
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="descriptionEn" className="text-sm font-medium text-muted-foreground">
                  English Description
                </Label>
                <Textarea 
                  id="descriptionEn" 
                  {...register('descriptionEn')} 
                  className="border-border focus:border-border-strong min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descriptionFr" className="text-sm font-medium text-muted-foreground">
                  French Description
                </Label>
                <Textarea 
                  id="descriptionFr" 
                  {...register('descriptionFr')} 
                  className="border-border focus:border-border-strong min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Price and Details */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price
                </Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01" 
                  {...register('price', { valueAsNumber: true })} 
                  className="border-border focus:border-border-strong"
                  disabled={isSubmitting}
                />
                {errors.price && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {errors.price.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="calories" className="text-sm font-medium text-muted-foreground">
                  Calories (optional)
                </Label>
                <Input 
                  id="calories" 
                  type="number" 
                  {...register('calories', { valueAsNumber: true })} 
                  className="border-border focus:border-border-strong"
                  disabled={isSubmitting}
                />
              </div>

              <div className="md:col-span-2">
                <DietarySelect
                  dietary={watch('dietary') || []}
                  allergens={watch('allergens') || []}
                  onDietaryChange={(v) => setValue('dietary', v, { shouldDirty: true })}
                  onAllergensChange={(v) => setValue('allergens', v, { shouldDirty: true })}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Category
                </Label>
                <select
                  id="subcategory"
                  {...register('subcategoryId')}
                  className="w-full border border-border focus:border-border-strong rounded-md px-3 py-2 text-sm focus:outline-hidden focus:ring-2"
                  disabled={isSubmitting}
                >
                  <option value="">No category</option>
                  {subcategories.map((s: Subcategory) => (
                    <option key={s.id} value={s.id}>
                      {s.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Image URL - Hidden field for form */}
            <input type="hidden" {...register('imageUrl')} value={imageUrl} />
            
            {/* Special Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Special Options</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isMostPurchased')}
                    className="rounded border-border text-muted-foreground"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-muted-foreground">Mark as Popular Dish</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dish Image Upload */}
        <ImageUpload
          restaurantName={restaurantName || 'Restaurant'}
          currentImageUrl={imageUrl}
          onImageUpload={(url) => {
            setImageUrl(url)
            setValue('imageUrl', url)
          }}
        />

        {/* AR Models Upload */}
        <ARFileUpload
          restaurantName={restaurantName || 'Restaurant'}
          currentUsdzUrl={usdzUrl}
          currentGlbUrl={glbUrl}
          onUsdzUpload={setUsdzUrl}
          onGlbUpload={setGlbUrl}
          onPreview={handlePreview}
        />

        {/* Save bar: only when there is something to save */}
        {(hasUnsavedChanges || saveStatus === 'saving' || saveStatus === 'error') && (
          <div className="sticky bottom-[72px] z-40 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-sheet md:bottom-4">
            <p className="text-sm text-muted-foreground">
              {saveStatus === 'error' ? 'Could not save. Check the fields and try again.' : saveStatus === 'saving' ? 'Saving…' : 'You have unsaved changes.'}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
                Discard
              </Button>
              <Button type="button" onClick={submitForm} disabled={isSubmitting}>
                {saveStatus === 'saving' ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
      
      {/* AR Model Preview */}
      {previewModel && (
        <ARModelPreview
          isOpen={!!previewModel}
          onClose={() => setPreviewModel(null)}
          modelUrl={previewModel.url}
          modelType={previewModel.type}
          dishName={watch('nameEn') || 'Dish Preview'}
        />
      )}
    </div>
  )
}
