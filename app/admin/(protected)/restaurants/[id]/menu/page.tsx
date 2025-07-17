import Link from "next/link";
import type { PageProps } from 'next'
import CategoryManager from "@/components/category-manager";
import { getMenu } from "@/app/actions/menu-actions";
import prisma from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Utensils } from "lucide-react";

export default async function MenuPage({ params }: PageProps<{ id: string }>) {
  const { id } = params;

  // Fetch the restaurant info
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
  });

  const data = await getMenu(id);

  if (!restaurant) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Restaurant not found
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/restaurants/${id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Restaurant
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              {restaurant.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage menu categories for this restaurant
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager initialData={data} restaurantId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
