import Link from "next/link";
import type { PageProps } from "next";
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
import { Input } from "@/components/ui/input";
import { MoreVertical, Search } from "lucide-react";
import { Suspense } from "react";

async function getRestaurants(searchQuery: string) {
  return await prisma.restaurant.findMany({
    where: {
      name: {
        contains: searchQuery,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function RestaurantsPage({
  searchParams,
}: PageProps<{}, { search?: string }>) {
  const searchQuery = searchParams?.search || "";
  const restaurants = await getRestaurants(searchQuery);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Restaurants</h2>
        <Link
          href="/admin/restaurants/create"
          className={buttonVariants({ variant: "default" })}
        >
          Create Restaurant
        </Link>
      </div>

      {/* Search bar */}
      <form
        className="flex max-w-sm items-center gap-2"
        action="/admin/restaurants"
      >
        <Input
          name="search"
          placeholder="Search restaurants..."
          defaultValue={searchQuery}
          className="w-full"
        />
        <Button variant="outline" type="submit">
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </form>

      {/* Restaurants List */}
      <Card>
        <CardHeader>
          <CardTitle>All Restaurants</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {restaurants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchQuery
                ? `No restaurants found for "${searchQuery}".`
                : "No restaurants found."}
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
                    className={`border-b hover:bg-muted/50 ${
                      i % 2 === 0 ? "bg-muted/30" : ""
                    }`}
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
                          className="bg-white border border-border rounded-md shadow-lg p-1 min-w-[10rem]"
                        >
                          <DropdownMenuItem asChild className="p-0">
                            <Link
                              href={`/admin/restaurants/${r.id}/edit`}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 focus:bg-gray-100"
                            >
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="p-0">
                            <div className="w-full">
                              <DeleteRestaurantButton
                                id={r.id}
                                className="block w-full px-4 py-2 text-left text-sm text-red-600 font-semibold hover:bg-red-50 focus:bg-red-50"
                              />
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
