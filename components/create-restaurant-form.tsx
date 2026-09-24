"use client";

import { toast } from "sonner";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRestaurant } from "@/app/actions/restaurant-actions";
import { restaurantInput, type RestaurantInput } from "@/lib/schemas/restaurant";
import { DIETARY_OPTIONS } from "@/lib/menu";
import CreateBasicCard from "@/components/restaurant-form/create-basic-card";
import CreateContactCard from "@/components/restaurant-form/create-contact-card";
import CreateAddressCard from "@/components/restaurant-form/create-address-card";
import CreateBrandingCard from "@/components/restaurant-form/create-branding-card";
import FieldError from "@/components/forms/field-error";
import { firstFieldError } from "@/components/forms/schema-check";
import { RESTAURANT_FIELD_LABELS } from "@/components/restaurant-form/field-labels";
import { Clock, Share2 } from "lucide-react";

const schema = restaurantInput;

type FormValues = RestaurantInput;

/**
 * The super admin's new-restaurant form; a success clears it and stays on the page, and a failed
 * create is said in a toast.
 */
export default function CreateRestaurantForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    control,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultLocale: "en",
      email: "",
      logoUrl: "",
      website: "",
      coverImageUrl: "",
      coverImageStyle: "cover",
      dietaryOptions: DIETARY_OPTIONS.map((o) => o.key),
      currency: "USD",
      currencySymbol: "$",
    },
    mode: "onChange",
  });

  const dietaryOptions = useWatch({ control, name: "dietaryOptions" });

  const onSubmit = async (data: FormValues) => {
    try {
      await createRestaurant(data);
      reset();
    } catch {
      // Said where the admin is looking, not only logged: a create that failed silently looked
      // like a form that did nothing.
      toast.error("Could not create the restaurant. The slug may already be taken; check the fields and try again.");
    }
  };

  // A refusal is toasted by its field's label too: the uploads, the font and the colour pickers have
  // no line of their own, and a create that did nothing on submit said nothing at all.
  const onInvalid = (errs: Record<string, unknown>) => {
    toast.error("Could not create the restaurant", { description: firstFieldError(errs, RESTAURANT_FIELD_LABELS) ?? "Check the fields and try again." });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
      {/* Basic Information Section */}
      <CreateBasicCard register={register} errors={errors} setValue={setValue} dietaryOptions={dietaryOptions ?? []} />

      {/* Contact Information Section */}
      <CreateContactCard register={register} errors={errors} />

      {/* Address Section */}
      <CreateAddressCard register={register} />

      {/* Operating Hours Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Operating Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="openingHours">Opening Hours</Label>
            <Textarea
              id="openingHours"
              {...register("openingHours")}
              placeholder="Mon-Fri: 9:00 AM - 10:00 PM&#10;Sat-Sun: 10:00 AM - 11:00 PM"
              className="border-border min-h-[80px]"
            />
            <FieldError error={errors.openingHours} />
            <span className="text-xs text-muted-foreground">
              Enter your operating hours. Use line breaks for different days.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Branding & Design Section */}
      <CreateBrandingCard register={register} errors={errors} setValue={setValue} control={control} isSubmitting={isSubmitting} />

      {/* Social Media Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share2 className="h-5 w-5 text-muted-foreground" />
            Social Media
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="socialMedia">Social Media Links</Label>
            <Textarea
              id="socialMedia"
              {...register("socialMedia")}
              placeholder="Facebook: https://facebook.com/yourrestaurant&#10;Instagram: https://instagram.com/yourrestaurant&#10;Twitter: https://twitter.com/yourrestaurant"
              className="border-border min-h-[100px]"
            />
            <FieldError error={errors.socialMedia} />
            <span className="text-xs text-muted-foreground">
              Enter your social media links, one per line with platform name.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="text-white px-8 py-3 text-lg font-medium"
        >
          {isSubmitting ? "Creating Restaurant..." : "Create Restaurant"}
        </Button>
      </div>
    </form>
  );
}
