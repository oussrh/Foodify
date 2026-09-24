// FilePath: components/create-dish-form.tsx

"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDish } from "@/app/actions/dish-actions";
import { dishInput } from "@/lib/schemas/dish";
import { firstIssue } from "@/lib/schemas/common";
import { DishNameFields, DishDescriptionFields } from "@/components/dish-form/dish-fields";
import DishDetailsGrid from "@/components/dish-form/dish-details-grid";
import DishMediaUploads from "@/components/dish-form/dish-media-uploads";
import DishModelPreview from "@/components/dish-form/dish-model-preview";
import CreateDishSubmit from "@/components/dish-form/create-dish-submit";
import { useDishAssets } from "@/components/dish-form/use-dish-assets";
import { caloriesValue, dishFormSchema, dishPayload, type DishFormValues } from "@/components/dish-form/dish-form-schema";
import { useState } from "react";
import { ChefHat, AlertCircle, CheckCircle } from "lucide-react";

type Subcategory = { id: string; nameEn: string };

/**
 * Creates a dish in one restaurant with its names, details, dietary tags and uploaded image and AR
 * files; after a success it clears the fields and the uploads for the next dish.
 */
export default function CreateDishForm({
  restaurantId,
  subcategories,
  restaurantName,
  dietaryOptions,
}: {
  restaurantId: string;
  subcategories: Subcategory[];
  restaurantName?: string;
  /** The restaurant's dietary options (Settings → General): what the picker offers. */
  dietaryOptions: readonly string[];
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
  } = useForm<DishFormValues>({
    resolver: zodResolver(dishFormSchema),
    mode: "onChange",
  });
  const [dietary = [], allergens = [], nameEn] = useWatch({ control, name: ['dietary', 'allergens', 'nameEn'] })

  const onSubmit = async (data: DishFormValues) => {
    setError(null)
    // The whole payload through createDish's own schema: the asset URLs join it here, after the fields' check.
    const parsed = dishInput.safeParse(dishPayload(data, { imageUrl: imageUrl || data.imageUrl, usdzUrl, glbUrl }))
    if (!parsed.success) {
      setError(firstIssue(parsed.error))
      return
    }
    setIsSubmitting(true)

    try {
      await createDish(restaurantId, parsed.data);
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

            <DishDetailsGrid
              price={{ field: register("price"), error: errors.price, placeholder: "0.00" }}
              calories={{ field: register("calories", { setValueAs: caloriesValue }), error: errors.calories, placeholder: "250" }}
              subcategoryId={register("subcategoryId")}
              imageUrl={{ field: register("imageUrl"), value: imageUrl }}
              isMostPurchased={register("isMostPurchased")}
              subcategories={subcategories}
              tags={{ dietaryOptions, dietary, allergens, onDietaryChange: (v) => setValue('dietary', v, { shouldDirty: true }), onAllergensChange: (v) => setValue('allergens', v, { shouldDirty: true }) }}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        <DishMediaUploads restaurantName={restaurantName} assets={assets} onImageUrl={(url) => setValue('imageUrl', url)} />

        <CreateDishSubmit isSubmitting={isSubmitting} isDirty={isDirty} />
      </form>

      <DishModelPreview assets={assets} dishName={nameEn} />
    </div>
  );
}
