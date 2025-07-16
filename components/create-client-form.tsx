"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/app/actions/client-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Restaurant = { id: string; name: string };

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  restaurantId: z.string().optional(),
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
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    await createClient(data);
    reset();
  };

  return (
    <Card>
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

          {/* Existing Restaurant */}
          <div className="space-y-1">
            <Label>Assign to Existing Restaurant</Label>
            <Select onValueChange={(value) => setValue("restaurantId", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a restaurant" />
              </SelectTrigger>
              <SelectContent>
                {restaurants.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
