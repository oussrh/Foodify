// components/restaurant-form/create-basic-card.tsx
// The "Basic Information" card of the create-restaurant form: the identity fields (name,
// slug, tagline, description, cuisine, the dietary options offered) and the money and language fields
// (currency with its symbol, default language).
"use client";

import type { FieldErrors, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RestaurantInput } from "@/lib/schemas/restaurant";
import { Building2, Globe, ChefHat, CreditCard } from "lucide-react";
import DietaryOptionsField from "./dietary-options-field";
import { CURRENCIES, currencySymbolFor } from "./currencies";

type Props = {
  register: UseFormRegister<RestaurantInput>;
  errors: FieldErrors<RestaurantInput>;
  setValue: UseFormSetValue<RestaurantInput>;
  dietaryOptions: string[];
};

function IdentityFields({ register, errors, setValue, dietaryOptions }: Props) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Restaurant Name *
          </Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter restaurant name"
            className="border-border"
          />
          {errors.name && (
            <span className="text-sm text-destructive">{errors.name.message}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            URL Slug *
          </Label>
          <Input
            id="slug"
            {...register("slug")}
            placeholder="my-restaurant"
            className="font-mono border-border"
          />
          {errors.slug && (
            <span className="text-sm text-destructive">{errors.slug.message}</span>
          )}
          <span className="text-xs text-muted-foreground">
            Used in your restaurant&apos;s URL (yourslug.foodify.com)
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          {...register("tagline")}
          placeholder="Delicious food, unforgettable experience"
          className="border-border"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Tell customers about your restaurant..."
          className="border-border min-h-[100px]"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="cuisineType" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Cuisine Type
          </Label>
          <Input
            id="cuisineType"
            {...register("cuisineType")}
            placeholder="Italian, French, American..."
            className="border-border"
          />
        </div>

        <div className="space-y-2 md:pt-6">
          <DietaryOptionsField value={dietaryOptions} onChange={(next) => setValue("dietaryOptions", next)} />
        </div>
      </div>
    </>
  );
}

function LocaleFields({ register, setValue }: Omit<Props, "errors" | "dietaryOptions">) {
  return (
    <>
      {/* Currency Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="currency" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Currency
          </Label>
          <Select onValueChange={(value) => {
            setValue("currency", value);
            // Auto-set currency symbol based on selection
            setValue("currencySymbol", currencySymbolFor(value));
          }} defaultValue="USD">
            <SelectTrigger id="currency" className="border-border">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currencySymbol">Currency Symbol</Label>
          <Input
            id="currencySymbol"
            {...register("currencySymbol")}
            placeholder="$"
            className="border-border font-mono"
          />
          <span className="text-xs text-muted-foreground">
            This symbol will be displayed with prices
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultLocale">Default Language</Label>
        <Select onValueChange={(value) => setValue("defaultLocale", value as "en" | "fr")} defaultValue="en">
          <SelectTrigger id="defaultLocale" className="border-border">
            <SelectValue placeholder="Select default language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

/**
 * The create-restaurant form's Basic Information card: identity fields, the dietary options
 * offered, currency and default language. Picking a currency also fills its symbol, which stays
 * editable here.
 */
export default function CreateBasicCard(props: Props) {
  return (
    <Card className="border-border">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <IdentityFields {...props} />
        <LocaleFields register={props.register} setValue={props.setValue} />
      </CardContent>
    </Card>
  );
}
