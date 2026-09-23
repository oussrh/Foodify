// components/restaurant-form/create-branding-card.tsx
// The "Branding & Design" card of the create-restaurant form: the logo and cover uploads,
// the two brand colours, the Google font and the cover style. Watches the three URL fields
// it displays.
"use client";

import { useWatch } from "react-hook-form";
import type { Control, UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RestaurantInput } from "@/lib/schemas/restaurant";
import RestaurantLogoUpload from "@/components/restaurant-logo-upload";
import RestaurantCoverUpload from "@/components/restaurant-cover-upload";
import GoogleFontsSelector from "@/components/google-fonts-selector";
import { Palette, ImageIcon, Monitor } from "lucide-react";

/**
 * The create-restaurant form's branding card: logo and cover uploads, the two brand colours, the
 * Google font and the cover style. Uploads and the font write their URLs into the form through
 * setValue.
 */
export default function CreateBrandingCard({
  register,
  setValue,
  control,
  isSubmitting,
}: {
  register: UseFormRegister<RestaurantInput>;
  setValue: UseFormSetValue<RestaurantInput>;
  control: Control<RestaurantInput>;
  isSubmitting: boolean;
}) {
  const logoUrl = useWatch({ control, name: "logoUrl" });
  const coverImageUrl = useWatch({ control, name: "coverImageUrl" });
  const googleFontUrl = useWatch({ control, name: "googleFontUrl" });

  return (
    <Card className="border-border">
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5 text-muted-foreground" />
          Branding & Design
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Logo Upload */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-medium leading-none">
            <ImageIcon className="h-4 w-4" />
            Restaurant Logo
          </p>
          <RestaurantLogoUpload
            restaurantSlug=""
            restaurantName="New Restaurant"
            currentLogoUrl={logoUrl}
            onLogoUpload={(url) => setValue("logoUrl", url)}
            disabled={isSubmitting}
          />
        </div>

        {/* Cover Image Upload */}
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-medium leading-none">
            <ImageIcon className="h-4 w-4" />
            Restaurant Cover Image
          </p>
          <RestaurantCoverUpload
            restaurantSlug=""
            restaurantName="New Restaurant"
            currentCoverUrl={coverImageUrl}
            onCoverUpload={(url) => setValue("coverImageUrl", url)}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="colorTheme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Primary Brand Color
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="colorTheme"
                type="color"
                {...register("colorTheme")}
                className="h-12 w-20 border-border"
              />
              <Input
                type="text"
                {...register("colorTheme")}
                aria-label="Brand color as a hex value"
                placeholder="#3B82F6"
                className="flex-1 border-border font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex items-center gap-3">
              <Input
                id="secondaryColor"
                type="color"
                {...register("secondaryColor")}
                className="h-12 w-20 border-border"
              />
              <Input
                type="text"
                {...register("secondaryColor")}
                aria-label="Secondary color as a hex value"
                placeholder="#6B7280"
                className="flex-1 border-border font-mono"
              />
            </div>
          </div>
        </div>

        {/* Google Fonts Selection */}
        <div className="space-y-4">
          <GoogleFontsSelector
            currentFontUrl={googleFontUrl}
            onFontChange={(fontUrl, fontFamily) => {
              setValue("googleFontUrl", fontUrl);
              setValue("fontFamily", fontFamily);
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* Cover Image Style */}
        <div className="space-y-2">
          <Label htmlFor="coverImageStyle" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Cover Image Background Style
          </Label>
          <Select onValueChange={(value) => setValue("coverImageStyle", value as "cover" | "repeat")} defaultValue="cover">
            <SelectTrigger id="coverImageStyle" className="border-border">
              <SelectValue placeholder="Select background style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">
                <div className="space-y-1">
                  <div className="font-medium">Cover (Recommended)</div>
                  <div className="text-xs text-muted-foreground">Image fills the entire background area</div>
                </div>
              </SelectItem>
              <SelectItem value="repeat">
                <div className="space-y-1">
                  <div className="font-medium">Repeat Pattern</div>
                  <div className="text-xs text-muted-foreground">Image repeats as a pattern/texture</div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
