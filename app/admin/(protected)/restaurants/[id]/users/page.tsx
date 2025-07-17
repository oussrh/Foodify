import Link from "next/link";
import type { AppPageProps } from "@/types/page";
import prisma from "@/lib/prisma";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, UserX, ArrowLeft } from "lucide-react";
import AssignUsersDialog from "@/components/assign-users-dialog";
import RemoveRestaurantUserButton from "@/components/remove-restaurant-user-button";

export default async function RestaurantUsersPage({
  params,
}: AppPageProps<{ id: string }>) {
  const { id } = params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { users: true },
  });

  if (!restaurant) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Restaurant not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/restaurants/${restaurant.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Restaurant
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight">
            Users for{" "}
            <span className="text-primary font-bold">{restaurant.name}</span>
          </h2>
        </div>
        <AssignUsersDialog
          restaurantId={restaurant.id}
          defaultUserIds={restaurant.users.map((u) => u.id)}
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Managers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {restaurant.users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No users assigned.
            </p>
          ) : (
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurant.users.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b hover:bg-muted/50 ${
                      i % 2 === 0 ? "bg-muted/30" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">{u.email}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-white border border-border rounded-md shadow-lg p-1 min-w-[10rem] space-y-1"
                        >
                          {/* EDIT ITEM */}
                          <DropdownMenuItem asChild className="p-0">
                            <Link
                              href={`/admin/users/${u.id}/edit`}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 rounded"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>

                          {/* REMOVE ITEM */}
                          <DropdownMenuItem asChild className="p-0">
                            <button
                              type="button"
                              className="flex items-center gap-2 w-full px-4 py-2 text-left text-sm text-destructive hover:bg-red-50 rounded"
                            >
                              <UserX className="h-4 w-4" />
                              <RemoveRestaurantUserButton
                                restaurantId={restaurant.id}
                                userIds={restaurant.users.map((r) => r.id)}
                                userId={u.id}
                              />
                            </button>
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
