// FilePath: components/create-dish-form.tsx

"use client";

import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DietarySelect from "@/components/dietary-select";
import { createDish } from "@/app/actions/dish-actions";
import { dishInput } from "@/lib/schemas/dish";
import { DishNameFields, DishDescriptionFields } from "@/components/dish-form/dish-fields";
import {
  DishPriceField,
  DishCaloriesField,
  DishCategorySelect,
  DishPopularCheckbox,
} from "@/components/dish-form/dish-detail-fields";
import DishMediaUploads from "@/components/dish-form/dish-media-uploads";
import DishModelPreview from "@/components/dish-form/dish-model-preview";
import CreateDishSubmit from "@/components/dish-form/create-dish-submit";
import { useDishAssets } from "@/components/dish-form/use-dish-assets";
import { createDishPayload } from "@/components/dish-form/create-dish-payload";
import { useState } from "react";
import { ChefHat, AlertCircle, CheckCircle } from "lucide-react";

type Subcategory = { id: string; nameEn: string };

// Simple schema without transforms - handle conversion manually
// The dish rules, with the two numeric fields as the text they are typed in (the submit converts them).
const schema = dishInput.omit({ calories: true, subcategoryId: true }).extend({
  calories: z.string().optional(),
  subcategoryId: z.string().optional(),
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
  const assets = useDishAssets({})
  const { imageUrl, usdzUrl, glbUrl, resetAssets } = assets

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    control,
    setError: setFormError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });
  const [dietary = [], allergens = [], nameEn] = useWatch({ control, name: ['dietary', 'allergens', 'nameEn'] })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    setError(null)

    // Manual validation and conversion
    let calories: number | undefined;
    if (data.calories && data.calories !== "") {
      calories = parseInt(data.calories);
      if (isNaN(calories)) {
        setFormError("calories", { message: "Calories must be a valid number" });
        setIsSubmitting(false);
        return;
      }
    }

    const finalData = createDishPayload(data, calories, { imageUrl, usdzUrl, glbUrl })

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
      resetAssets({})
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Failed to create dish. Please try again.')
      console.error('Error creating dish:', err)
    } finally {
      setIsSubmitting(false)
    }
  };

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
            <DishNameFields
              nameEn={register("nameEn")}
              nameFr={register("nameFr")}
              errors={errors}
              disabled={isSubmitting}
              placeholders={{ en: "Enter dish name in English", fr: "Entrez le nom du plat en français" }}
            />

            {/* Descriptions */}
            <DishDescriptionFields
              descriptionEn={register("descriptionEn")}
              descriptionFr={register("descriptionFr")}
              disabled={isSubmitting}
              placeholders={{ en: "Describe the dish in English", fr: "Décrivez le plat en français" }}
            />

            {/* Price and Details */}
            <div className="grid md:grid-cols-3 gap-6">
              <DishPriceField field={register("price")} error={errors.price} disabled={isSubmitting} placeholder="0.00" />
              <DishCaloriesField field={register("calories")} error={errors.calories} disabled={isSubmitting} placeholder="250" />

              <div className="md:col-span-2">
                <DietarySelect
                  dietary={dietary}
                  allergens={allergens}
                  onDietaryChange={(v) => setValue('dietary', v, { shouldDirty: true })}
                  onAllergensChange={(v) => setValue('allergens', v, { shouldDirty: true })}
                  disabled={isSubmitting}
                />
              </div>

              <DishCategorySelect field={register("subcategoryId")} subcategories={subcategories} disabled={isSubmitting} />
            </div>

            {/* Image URL - Hidden field for form */}
            <input type="hidden" {...register("imageUrl")} value={imageUrl} />

            {/* Special Options */}
            <DishPopularCheckbox field={register("isMostPurchased")} disabled={isSubmitting} />
          </CardContent>
        </Card>

        <DishMediaUploads restaurantName={restaurantName} assets={assets} onImageUrl={(url) => setValue('imageUrl', url)} />

        <CreateDishSubmit isSubmitting={isSubmitting} isDirty={isDirty} />
      </form>

      <DishModelPreview assets={assets} dishName={nameEn} />
    </div>
  );
}
