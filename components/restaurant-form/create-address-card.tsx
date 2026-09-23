// components/restaurant-form/create-address-card.tsx
// The "Address Information" card of the create-restaurant form: street, city, state, postal
// code and country.
"use client";

import type { UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RestaurantInput } from "@/lib/schemas/restaurant";
import { MapPin } from "lucide-react";

/**
 * The create-restaurant form's address card: street, city, state, postal code and country, all
 * optional and registered straight on the form.
 */
export default function CreateAddressCard({ register }: { register: UseFormRegister<RestaurantInput> }) {
  return (
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
  );
}
