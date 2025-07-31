'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { updateDish } from '@/app/actions/dish-actions'
import ARFileUpload from '@/components/ar-file-upload'
import ARModelPreview from '@/components/ar-model-preview'
import ImageUpload from '@/components/image-upload'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  ChefHat, 
  Globe, 
  DollarSign, 
  Image as ImageIcon,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Utensils,
  Edit,
  X
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
      {/* Enhanced Status Indicator */}
      <div className="flex items-center justify-between">
        <div>
          {hasUnsavedChanges ? (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 shadow-lg">
              <AlertCircle className="h-3 w-3 mr-1" />
              Unsaved changes
              <kbd className="ml-2 px-1 py-0.5 text-xs bg-yellow-100 rounded">Ctrl+S</kbd>
            </Badge>
          ) : saveStatus === 'saved' ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 shadow-lg">
              <CheckCircle className="h-3 w-3 mr-1" />
              All changes saved
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              Up to date
            </Badge>
          )}
        </div>
        
        {/* Enhanced Save Button */}
        <Button
          onClick={submitForm}
          disabled={!hasUnsavedChanges || isSubmitting}
          className={`transition-all duration-300 ${
            hasUnsavedChanges
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white scale-105 hover:scale-110'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed scale-100'
          }`}
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : saveStatus === 'error' ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2" />
              Try Again
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
            </>
          )}
        </Button>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Dish Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Names */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nameEn" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  English Name
                </Label>
                <Input 
                  id="nameEn" 
                  {...register('nameEn')} 
                  className="border-blue-200 focus:border-blue-400"
                  disabled={isSubmitting}
                />
                {errors.nameEn && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.nameEn.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nameFr" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  French Name
                </Label>
                <Input 
                  id="nameFr" 
                  {...register('nameFr')} 
                  className="border-blue-200 focus:border-blue-400"
                  disabled={isSubmitting}
                />
                {errors.nameFr && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.nameFr.message}
                  </p>
                )}
              </div>
            </div>

            {/* Descriptions */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="descriptionEn" className="text-sm font-medium text-gray-700">
                  English Description
                </Label>
                <Textarea 
                  id="descriptionEn" 
                  {...register('descriptionEn')} 
                  className="border-blue-200 focus:border-blue-400 min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descriptionFr" className="text-sm font-medium text-gray-700">
                  French Description
                </Label>
                <Textarea 
                  id="descriptionFr" 
                  {...register('descriptionFr')} 
                  className="border-blue-200 focus:border-blue-400 min-h-[100px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Price and Details */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Price
                </Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.01" 
                  {...register('price', { valueAsNumber: true })} 
                  className="border-blue-200 focus:border-blue-400"
                  disabled={isSubmitting}
                />
                {errors.price && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                    {errors.price.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="calories" className="text-sm font-medium text-gray-700">
                  Calories (optional)
                </Label>
                <Input 
                  id="calories" 
                  type="number" 
                  {...register('calories', { valueAsNumber: true })} 
                  className="border-blue-200 focus:border-blue-400"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Category
                </Label>
                <select
                  id="subcategory"
                  {...register('subcategoryId')}
                  className="w-full border border-blue-200 focus:border-blue-400 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20"
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
              <Label className="text-sm font-medium text-gray-700">Special Options</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('isMostPurchased')}
                    className="rounded border-blue-200 text-blue-600 focus:ring-blue-400"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Mark as Popular Dish</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dish Image Upload */}
        <ImageUpload
          restaurantId={restaurantId}
          restaurantName={restaurantName || 'Restaurant'}
          currentImageUrl={imageUrl}
          onImageUpload={(url) => {
            setImageUrl(url)
            setValue('imageUrl', url)
          }}
        />

        {/* AR Models Upload */}
        <ARFileUpload
          restaurantId={restaurantId}
          restaurantName={restaurantName || 'Restaurant'}
          currentUsdzUrl={usdzUrl}
          currentGlbUrl={glbUrl}
          onUsdzUpload={setUsdzUrl}
          onGlbUpload={setGlbUrl}
          onPreview={handlePreview}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <Button 
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel Changes
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+S</kbd>
            <span>to save</span>
            <span>•</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
            <span>to cancel</span>
          </div>
        </div>
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
