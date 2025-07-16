import Link from "next/link";
import prisma from "@/lib/prisma";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import AssignUsersDialog from "@/components/assign-users-dialog";
import RemoveRestaurantUserButton from "@/components/remove-restaurant-user-button";

export default async function RestaurantUsersPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { users: true },
  });

  if (!restaurant) {
    return <div className="py-12 text-center text-muted-foreground">Restaurant not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">Users for {restaurant.name}</h2>
        <AssignUsersDialog
          restaurantId={restaurant.id}
          defaultUserIds={restaurant.users.map((u) => u.id)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Managers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {restaurant.users.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No users assigned.</p>
          ) : (
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {restaurant.users.map((u, i) => (
                  <tr
                    key={u.id}
                    className={`border-b hover:bg-muted/50 ${i % 2 === 0 ? "bg-muted/30" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">{u.email}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background rounded-md shadow-lg border border-border">
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted">
                            <Link href={`/admin/users/${u.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <RemoveRestaurantUserButton
                              restaurantId={restaurant.id}
                              userIds={restaurant.users.map((r) => r.id)}
                              userId={u.id}
                            />
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
