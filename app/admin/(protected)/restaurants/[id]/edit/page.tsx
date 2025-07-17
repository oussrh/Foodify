//FilePath : app/admin/(protected)/restaurants/[id]/edit/page.tsx

import Link from "next/link";
import prisma from "@/lib/prisma";
import EditRestaurantForm, {
  type EditRestaurantValues,
} from "@/components/edit-restaurant-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { buttonVariants, Button } from "@/components/ui/button";
import { ArrowLeft, Utensils, Users, ChefHat, Building2 } from "lucide-react";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });
  
  if (!restaurant) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Restaurant not found
      </div>
    );
  }
  
  const defaultValues: EditRestaurantValues = {
    name: restaurant.name,
    slug: restaurant.slug,
    email: restaurant.email ?? "",
    phone: restaurant.phone ?? "",
    tagline: restaurant.tagline ?? "",
    logoUrl: restaurant.logoUrl ?? "",
    colorTheme: restaurant.colorTheme ?? "",
    defaultLocale: restaurant.defaultLocale,
  };
  
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/restaurants"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href={`/admin/restaurants/${restaurant.id}/menu`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Utensils className="w-4 h-4 mr-2 text-primary" /> Manage Menu
          </Link>
          <Link
            href={`/admin/restaurants/${restaurant.id}/users`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Users className="w-4 h-4 mr-2 text-primary" /> Manage Users
          </Link>
          <Link
            href={`/admin/restaurants/${restaurant.id}/dishes`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ChefHat className="w-4 h-4 mr-2 text-primary" /> Manage Dishes
          </Link>
        </div>
      </div>
      {/* Edit Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Edit Restaurant Details</CardTitle>
          <CardDescription className="text-muted-foreground">
            Update the information for{" "}
            <span className="font-semibold text-primary">
              {restaurant.name}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditRestaurantForm
            id={restaurant.id}
            defaultValues={defaultValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}
