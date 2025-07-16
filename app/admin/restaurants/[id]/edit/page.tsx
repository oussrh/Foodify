import Link from "next/link";
import prisma from "@/lib/prisma";
import EditRestaurantForm, {
  EditRestaurantValues,
} from "@/components/edit-restaurant-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft, Utensils, Users, ChefHat } from 'lucide-react'

export default async function EditRestaurantPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params
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
    defaultLocale: restaurant.defaultLocale,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/restaurants"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight">Edit Restaurant</h2>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/restaurants/${restaurant.id}/menu`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Utensils className="w-4 h-4 mr-2" /> Manage Menu
          </Link>
          <Link
            href={`/admin/restaurants/${restaurant.id}/users`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <Users className="w-4 h-4 mr-2" /> Manage Users
          </Link>
          <Link
            href={`/admin/restaurants/${restaurant.id}/dishes`}
            className={buttonVariants({ variant: 'outline' })}
          >
            <ChefHat className="w-4 h-4 mr-2" /> Manage Dishes
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{restaurant.name}</CardTitle>
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
