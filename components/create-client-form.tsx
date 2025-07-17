// components/create-client-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/app/actions/client-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Restaurant = { id: string; name: string };

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  restaurantIds: z.array(z.string()).optional(),
  restaurantName: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateClientForm({
  restaurants,
}: {
  restaurants: Restaurant[];
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    await createClient({ ...data, restaurantIds: data.restaurantIds || [] });
    reset();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Client</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Existing Restaurants */}
          <div className="space-y-1">
            <Label>Select Existing Restaurants</Label>
            <div className="flex flex-col gap-1">
              {restaurants.map((r: Restaurant) => (
                <div key={r.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`restaurant-${r.id}`}
                    value={r.id}
                    {...register('restaurantIds')}
                  />
                  <Label htmlFor={`restaurant-${r.id}`} className="font-normal">
                    {r.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">OR</div>

          {/* New Restaurant */}
          <div className="space-y-1">
            <Label htmlFor="restaurantName">New Restaurant Name</Label>
            <Input id="restaurantName" {...register("restaurantName")} />
            {errors.restaurantName && (
              <p className="text-xs text-destructive">
                {errors.restaurantName.message}
              </p>
            )}
          </div>

          <Button type="submit" className="mt-4">
            Create Client
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
