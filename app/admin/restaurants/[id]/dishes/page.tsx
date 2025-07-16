import Link from 'next/link'
import prisma from '@/lib/prisma'
import { buttonVariants, Button } from '@/components/ui/button'
import DeleteDishButton from '@/components/delete-dish-button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

export default async function DishesPage({ params }: { params: { id: string } }) {
  const restaurant = await prisma.restaurant.findUnique({ where: { id: params.id } })
  if (!restaurant) {
    return (
      <div className="py-12 text-center text-muted-foreground">Restaurant not found</div>
    )
  }
  const dishes = await prisma.dish.findMany({
    where: { restaurantId: restaurant.id },
    include: { subcategory: true },
    orderBy: { sortOrder: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">
          Dishes for {restaurant.name}
        </h2>
        <Link
          href={`/admin/restaurants/${restaurant.id}/dishes/create`}
          className={buttonVariants({ variant: 'default' })}
        >
          Create Dish
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Dishes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {dishes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No dishes found.</p>
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
                    className={`border-b hover:bg-muted/50 ${i % 2 === 0 ? 'bg-muted/30' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{d.nameEn}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.subcategory?.nameEn || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background rounded-md shadow-lg border border-border">
                          <DropdownMenuItem asChild className="cursor-pointer hover:bg-muted">
                            <Link href={`/admin/restaurants/${restaurant.id}/dishes/${d.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <DeleteDishButton id={d.id} />
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
