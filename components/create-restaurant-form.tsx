"use client";

import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRestaurant } from "@/app/actions/restaurant-actions";
import RestaurantLogoUpload from "@/components/restaurant-logo-upload";
import RestaurantCoverUpload from "@/components/restaurant-cover-upload";
import GoogleFontsSelector from "@/components/google-fonts-selector";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Palette,
  ImageIcon,
  Clock,
  DollarSign,
  ChefHat,
  Share2,
  CreditCard,
  Monitor,
} from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  tagline: z.string().optional(),
  logoUrl: z.string().optional(),
  colorTheme: z.string().optional(),
  defaultLocale: z.enum(["en", "fr"]),
  // Address fields
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  // Business info fields
  website: z.string().url("Invalid URL format").optional().or(z.literal("")),
  description: z.string().optional(),
  cuisineType: z.string().optional(),
  priceRange: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  openingHours: z.string().optional(),
  socialMedia: z.string().optional(),
  // Design fields
  coverImageUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
  coverImageStyle: z.enum(["cover", "repeat"]).optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  googleFontUrl: z.string().optional(),
  // Business settings
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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
      priceRange: "$",
      currency: "USD",
      currencySymbol: "$",
    },
    mode: "onChange",
  });

  const logoUrl = useWatch({ control, name: "logoUrl" });
  const coverImageUrl = useWatch({ control, name: "coverImageUrl" });
  const googleFontUrl = useWatch({ control, name: "googleFontUrl" });

  const onSubmit = async (data: FormValues) => {
    try {
      await createRestaurant(data);
      reset();
    } catch (error) {
      console.error("Failed to create restaurant:", error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="priceRange" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Range
              </Label>
              <Select onValueChange={(value) => setValue("priceRange", value as "$" | "$$" | "$$$" | "$$$$")} defaultValue="$">
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$ - Budget Friendly</SelectItem>
                  <SelectItem value="$$">$$ - Moderate</SelectItem>
                  <SelectItem value="$$$">$$$ - Upscale</SelectItem>
                  <SelectItem value="$$$$">$$$$ - Fine Dining</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                const symbols: Record<string, string> = {
                  "USD": "$", "EUR": "€", "GBP": "£", "CAD": "C$", 
                  "JPY": "¥", "AUD": "A$", "CHF": "CHF", "CNY": "¥",
                  "INR": "₹", "BRL": "R$", "MXN": "$", "ZAR": "R"
                };
                setValue("currencySymbol", symbols[value] || value);
              }} defaultValue="USD">
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">🇺🇸 USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">🇪🇺 EUR - Euro</SelectItem>
                  <SelectItem value="GBP">🇬🇧 GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">🇨🇦 CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="JPY">🇯🇵 JPY - Japanese Yen</SelectItem>
                  <SelectItem value="AUD">🇦🇺 AUD - Australian Dollar</SelectItem>
                  <SelectItem value="CHF">🇨🇭 CHF - Swiss Franc</SelectItem>
                  <SelectItem value="CNY">🇨🇳 CNY - Chinese Yuan</SelectItem>
                  <SelectItem value="INR">🇮🇳 INR - Indian Rupee</SelectItem>
                  <SelectItem value="BRL">🇧🇷 BRL - Brazilian Real</SelectItem>
                  <SelectItem value="MXN">🇲🇽 MXN - Mexican Peso</SelectItem>
                  <SelectItem value="ZAR">🇿🇦 ZAR - South African Rand</SelectItem>
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
              <SelectTrigger className="border-border">
                <SelectValue placeholder="Select default language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-success" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contact@restaurant.com"
                className="border-border"
              />
              {errors.email && (
                <span className="text-sm text-destructive">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                {...register("phone")}
                placeholder="+1 (555) 123-4567"
                className="border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              {...register("website")}
              placeholder="https://www.yourrestaurant.com"
              className="border-border"
            />
            {errors.website && (
              <span className="text-sm text-destructive">{errors.website.message}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address Section */}
      <Card className="border-border">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-warning" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="streetAddress">Street Address</Label>
            <Input
              id="streetAddress"
              {...register("streetAddress")}
              placeholder="123 Main Street"
              className="border-border"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register("city")}
                placeholder="New York"
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                {...register("state")}
                placeholder="NY"
                className="border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                {...register("postalCode")}
                placeholder="10001"
                className="border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              {...register("country")}
              placeholder="United States"
              className="border-border"
            />
          </div>
        </CardContent>
      </Card>

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
            <span className="text-xs text-muted-foreground">
              Enter your operating hours. Use line breaks for different days.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Branding & Design Section */}
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
            <p className="flex items-center gap-2 text-sm font-medium">
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
            <p className="flex items-center gap-2 text-sm font-medium">
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
              <SelectTrigger className="border-border">
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
