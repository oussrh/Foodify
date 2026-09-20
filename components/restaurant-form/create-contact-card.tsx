// components/restaurant-form/create-contact-card.tsx
// The "Contact Information" card of the create-restaurant form: email, phone and website.
"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RestaurantInput } from "@/lib/schemas/restaurant";
import { Phone, Mail, Globe } from "lucide-react";

export default function CreateContactCard({
  register,
  errors,
}: {
  register: UseFormRegister<RestaurantInput>;
  errors: FieldErrors<RestaurantInput>;
}) {
  return (
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
  );
}
