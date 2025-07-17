// PathFile: app/admin/(protected)/restaurants/[id]/dishes/page.tsx

import Link from "next/link";
import prisma from "@/lib/prisma";
import { buttonVariants, Button } from "@/components/ui/button";
import DeleteDishButton from "@/components/delete-dish-button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ArrowLeft, PlusCircle } from "lucide-react";

export default async function DishesPage({
  params,
}: {
  params: Promise<{ id: string }>
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

  const dishes = await prisma.dish.findMany({
    where: { restaurantId: restaurant.id },
    include: { subcategory: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/restaurants/${restaurant.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Restaurant
          </Link>
          <h1 className="text-3xl font-bold text-primary">
            Dishes for {restaurant.name}
          </h1>
        </div>
        <Link
          href={`/admin/restaurants/${restaurant.id}/dishes/create`}
          className={buttonVariants({ variant: "default", size: "sm" })}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Dish
        </Link>
      </div>

      {/* Dishes Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Dishes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {dishes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No dishes found.
            </p>
          ) : (
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Subcategory</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dishes.map((d, i) => (
                  <tr
                    key={d.id}
                    className={`border-b hover:bg-muted/50 ${
                      i % 2 === 0 ? "bg-muted/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{d.nameEn}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.subcategory?.nameEn || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-background border border-border rounded-md shadow-lg min-w-[10rem] p-1 space-y-1"
                        >
                          <DropdownMenuItem asChild className="p-0">
                            <Link
                              href={`/admin/restaurants/${restaurant.id}/dishes/${d.id}/edit`}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 rounded"
                            >
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="p-0">
                            <div className="block w-full px-4 py-2 text-left text-sm text-red-600 font-semibold hover:bg-red-50 rounded cursor-pointer">
                              <DeleteDishButton id={d.id} />
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
