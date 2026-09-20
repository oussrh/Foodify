// FilePath: components/create-dish-form.tsx

"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DietarySelect from "@/components/dietary-select";
import { createDish } from "@/app/actions/dish-actions";
import ARFileUpload from "@/components/ar-file-upload";
import ARModelPreview from "@/components/ar-model-preview";
import ImageUpload from "@/components/image-upload";
import { useState } from "react";
import {
  ChefHat,
  Globe,
  DollarSign,
  Save,
  AlertCircle,
  CheckCircle,
  Utensils,
} from "lucide-react";

type Subcategory = { id: string; nameEn: string };

interface Restaurant {
  id: string;
  name: string;
}

// Simple schema without transforms - handle conversion manually
const schema = z.object({
  nameEn: z.string().min(1, "English name is required"),
  nameFr: z.string().min(1, "French name is required"),
  descriptionEn: z.string().optional(),
  descriptionFr: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  imageUrl: z.string().min(1, "Image URL is required"),
  usdzUrl: z.string().optional(),
  glbUrl: z.string().optional(),
  subcategoryId: z.string().optional(),
  calories: z.string().optional(),
  isMostPurchased: z.boolean().optional(),
  dietary: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateDishForm({
  restaurantId,
  subcategories,
  restaurantName,
}: {
  restaurantId: string;
  subcategories: Subcategory[];
  restaurantName?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usdzUrl, setUsdzUrl] = useState('')
  const [glbUrl, setGlbUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [previewModel, setPreviewModel] = useState<{url: string, type: 'usdz' | 'glb'} | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
    setError: setFormError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setError(null)
    
    // Manual validation and conversion
    const price = parseFloat(data.price);
    if (isNaN(price) || price < 0) {
      setFormError("price", { message: "Price must be a valid number greater than 0" });
      setIsSubmitting(false);
      return;
    }

    let calories: number | undefined;
    if (data.calories && data.calories !== "") {
      calories = parseInt(data.calories);
      if (isNaN(calories)) {
        setFormError("calories", { message: "Calories must be a valid number" });
        setIsSubmitting(false);
        return;
      }
    }
    
    const finalData = {
      nameEn: data.nameEn,
      nameFr: data.nameFr,
      descriptionEn: data.descriptionEn,
      descriptionFr: data.descriptionFr,
      price: price,
      calories: calories,
      imageUrl: imageUrl || data.imageUrl,
      subcategoryId: data.subcategoryId || null,
      usdzUrl: usdzUrl || '',
      glbUrl: glbUrl || '',
      isMostPurchased: data.isMostPurchased || false,
      dietary: data.dietary || [],
      allergens: data.allergens || [],
    }
    
    console.log('Create dish form submission data:', {
      formData: data,
      usdzUrl,
      glbUrl,
      imageUrl,
      finalData
    })
    
    try {
      await createDish(restaurantId, finalData);
      setSuccess(true)
      reset()
      setUsdzUrl('')
      setGlbUrl('')
      setImageUrl('')
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to create dish. Please try again.')
      console.error('Error creating dish:', err)
    } finally {
      setIsSubmitting(false)
    }
  };
  
  const handlePreview = (modelUrl: string, modelType: 'usdz' | 'glb') => {
    setPreviewModel({ url: modelUrl, type: modelType })
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {success && (
        <div className="p-4 bg-muted border border-border rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm text-success font-medium">Dish created successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-muted border border-border rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive font-medium">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card className="border-0">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-muted-foreground" />
              Basic Information
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
                  {...register("nameEn")} 
                  className="border-border focus:border-border-strong"
                  placeholder="Enter dish name in English"
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
                  {...register("nameFr")} 
                  className="border-border focus:border-border-strong"
                  placeholder="Entrez le nom du plat en français"
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
                  {...register("descriptionEn")} 
                  className="border-border focus:border-border-strong min-h-[100px]"
                  placeholder="Describe the dish in English"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descriptionFr" className="text-sm font-medium text-muted-foreground">
                  French Description
                </Label>
                <Textarea 
                  id="descriptionFr" 
                  {...register("descriptionFr")} 
                  className="border-border focus:border-border-strong min-h-[100px]"
                  placeholder="Décrivez le plat en français"
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
                  {...register("price")} 
                  className="border-border focus:border-border-strong"
                  placeholder="0.00"
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
                  {...register("calories")} 
                  className="border-border focus:border-border-strong"
                  placeholder="250"
                  disabled={isSubmitting}
                />
                {errors.calories && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span className="w-1 h-1 bg-destructive rounded-full"></span>
                    {errors.calories.message}
                  </p>
                )}
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
                  {...register("subcategoryId")}
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
            <input type="hidden" {...register("imageUrl")} value={imageUrl} />
            
            {/* Special Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-muted-foreground">Special Options</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isMostPurchased")}
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

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Button 
            type="submit" 
            disabled={isSubmitting || !isDirty}
            className="flex-1 disabled:opacity-50"
            size="lg"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating Dish...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Create Dish
              </div>
            )}
          </Button>
          
          {isDirty && (
            <div className="flex items-center text-sm text-warning">
              <AlertCircle className="h-4 w-4 mr-1" />
              Unsaved changes
            </div>
          )}
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
  );
}
