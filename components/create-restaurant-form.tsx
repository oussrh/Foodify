"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRestaurant } from "@/app/actions/restaurant-actions";

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
  logoUrl: z.string().url("Invalid URL format").optional().or(z.literal("")),
  colorTheme: z.string().optional(),
  defaultLocale: z.enum(["en", "fr"]).default("en"),
});

type FormValues = z.infer<typeof schema>;

export default function CreateRestaurantForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      defaultLocale: "en",
      email: "",
      logoUrl: "",
    },
    mode: "onChange",
  });

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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Restaurant Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter restaurant name"
        />
        {errors.name && (
          <span className="text-sm text-red-500">{errors.name.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug * (URL identifier)</Label>
        <Input
          id="slug"
          {...register("slug")}
          placeholder="my-restaurant"
          className="font-mono"
        />
        {errors.slug && (
          <span className="text-sm text-red-500">{errors.slug.message}</span>
        )}
        <span className="text-xs text-gray-500">
          This will be used in your restaurant's URL (e.g.,
          yourslug.foodify.com)
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Contact Email</Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          placeholder="contact@restaurant.com"
        />
        {errors.email && (
          <span className="text-sm text-red-500">{errors.email.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input
          id="tagline"
          {...register("tagline")}
          placeholder="Delicious food, unforgettable experience"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input
          id="logoUrl"
          type="url"
          {...register("logoUrl")}
          placeholder="https://example.com/logo.png"
        />
        {errors.logoUrl && (
          <span className="text-sm text-red-500">{errors.logoUrl.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="colorTheme">Brand Color</Label>
        <Input
          id="colorTheme"
          type="color"
          {...register("colorTheme")}
          className="h-12 w-20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultLocale">Default Language</Label>
        <select
          id="defaultLocale"
          {...register("defaultLocale")}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </div>

      <Button type="submit" disabled={isSubmitting} className="mt-4">
        {isSubmitting ? "Creating..." : "Create Restaurant"}
      </Button>
    </form>
  );
}
