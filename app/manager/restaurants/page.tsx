import Link from 'next/link'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

export default async function ManagerRestaurantsPage() {
  const session = await auth()
  const restaurants = await prisma.restaurant.findMany({
    where: { users: { some: { id: session!.user.id } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">My Restaurants</h2>
      <Card>
        <CardHeader>
          <CardTitle>Restaurants</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {restaurants.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No restaurants assigned.</p>
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
                    className={`border-b hover:bg-muted/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.slug}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-background border border-border rounded-md shadow-lg min-w-[10rem]"
                        >
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted">
                            <Link href={`/manager/restaurants/${r.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted">
                            <Link href={`/manager/restaurants/${r.id}/menu`}>Manage Menu</Link>
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
