import Link from "next/link";
import prisma from "@/lib/prisma";
import EditRestaurantForm, {
  EditRestaurantValues,
} from "@/components/edit-restaurant-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function EditRestaurantPage({
  params,
}: {
  params: { id: string };
}) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: params.id },
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
        <h2 className="text-2xl font-semibold tracking-tight">
          Edit Restaurant
        </h2>
        <div className="flex gap-2">
          <Link
            href={`/admin/restaurants/${restaurant.id}/menu`}
            className={buttonVariants({ variant: "outline" })}
          >
            Manage Menu
          </Link>
          <Link
            href={`/admin/restaurants/${restaurant.id}/users`}
            className={buttonVariants({ variant: "outline" })}
          >
            Manage Users
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
