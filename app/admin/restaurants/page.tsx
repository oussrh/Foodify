import Link from "next/link";
import prisma from "@/lib/prisma";
import { buttonVariants, Button } from "@/components/ui/button";
import DeleteRestaurantButton from "@/components/delete-restaurant-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Restaurants</h2>
        <Link
          href="/admin/restaurants/create"
          className={buttonVariants({ variant: "default" })}
        >
          Create Restaurant
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Restaurants</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {restaurants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No restaurants found.
            </p>
          ) : (
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r, i) => (
                  <tr
                    key={r.id}
                    className={
                      i % 2 === 0
                        ? "border-b bg-muted/30 hover:bg-muted/50"
                        : "border-b hover:bg-muted/50"
                    }
                  >
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.slug}
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
                          className="bg-background shadow-lg border border-border"
                        >
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/restaurants/${r.id}/edit`}>
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <DeleteRestaurantButton id={r.id} />
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
