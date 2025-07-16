import Link from 'next/link'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import AssignRestaurantsDialog from '@/components/assign-restaurants-dialog'
import RemoveUserRestaurantButton from '@/components/remove-user-restaurant-button'

export default async function UserRestaurantsPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: { restaurants: true },
  })

  if (!user) {
    return (
      <div className="py-12 text-center text-muted-foreground">User not found</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          Restaurants for {user.email}
        </h2>
        <AssignRestaurantsDialog
          userId={user.id}
          defaultRestaurantIds={user.restaurants.map((r) => r.id)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Restaurants</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {user.restaurants.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No restaurants assigned.
            </p>
          ) : (
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {user.restaurants.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b hover:bg-muted/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-background rounded-md shadow-lg border border-border"
                        >
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted">
                            <Link href={`/admin/restaurants/${r.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <RemoveUserRestaurantButton
                              userId={user.id}
                              restaurantIds={user.restaurants.map((res) => res.id)}
                              restaurantId={r.id}
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
  )
}
