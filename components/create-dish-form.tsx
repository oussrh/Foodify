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
import { Badge } from "@/components/ui/badge";
import { createDish } from "@/app/actions/dish-actions";
import ARFileUpload from "@/components/ar-file-upload";
import ARModelPreview from "@/components/ar-model-preview";
import ImageUpload from "@/components/image-upload";
import { useState } from "react";
import { 
  ChefHat, 
  Globe, 
  DollarSign, 
  Image as ImageIcon,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Utensils
} from "lucide-react";

type Subcategory = { id: string; nameEn: string };

interface Restaurant {
  id: string;
  name: string;
}

// Input schema (what the form receives)
const inputSchema = z.object({
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
});

// Output schema (what gets processed)
const outputSchema = inputSchema.transform((data) => ({
  ...data,
  price: (() => {
    const num = parseFloat(data.price);
    if (isNaN(num) || num < 0) {
      throw new Error("Price must be a valid number greater than 0");
    }
    return num;
  })(),
  calories: data.calories && data.calories !== "" ? (() => {
    const num = parseInt(data.calories);
    if (isNaN(num)) {
      throw new Error("Calories must be a valid number");
    }
    return num;
  })() : undefined,
}));

// Use input schema for form values
type FormValues = z.infer<typeof inputSchema>;
// Use output schema for processed data
type ProcessedFormValues = z.infer<typeof outputSchema>;

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
  } = useForm<FormValues>({
    resolver: zodResolver(outputSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ProcessedFormValues) => {
    setIsSubmitting(true)
    setError(null)
    
    const finalData = {
      ...data,
      imageUrl: imageUrl || data.imageUrl,
      subcategoryId: data.subcategoryId || null,
      usdzUrl: usdzUrl || '',
      glbUrl: glbUrl || '',
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
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">Dish created successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700 font-medium">{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-blue-600" />
              Basic Information
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
                  {...register("nameEn")} 
                  className="border-blue-200 focus:border-blue-400"
                  placeholder="Enter dish name in English"
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
                  {...register("nameFr")} 
                  className="border-blue-200 focus:border-blue-400"
                  placeholder="Entrez le nom du plat en français"
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
                  {...register("descriptionEn")} 
                  className="border-blue-200 focus:border-blue-400 min-h-[100px]"
                  placeholder="Describe the dish in English"
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descriptionFr" className="text-sm font-medium text-gray-700">
                  French Description
                </Label>
                <Textarea 
                  id="descriptionFr" 
                  {...register("descriptionFr")} 
                  className="border-blue-200 focus:border-blue-400 min-h-[100px]"
                  placeholder="Décrivez le plat en français"
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
                  {...register("price")} 
                  className="border-blue-200 focus:border-blue-400"
                  placeholder="0.00"
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
                  {...register("calories")} 
                  className="border-blue-200 focus:border-blue-400"
                  placeholder="250"
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
                  {...register("subcategoryId")}
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
            <input type="hidden" {...register("imageUrl")} value={imageUrl} />
            
            {/* Special Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Special Options</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isMostPurchased")}
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

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <Button 
            type="submit" 
            disabled={isSubmitting || !isDirty}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
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
            <div className="flex items-center text-sm text-amber-600">
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
