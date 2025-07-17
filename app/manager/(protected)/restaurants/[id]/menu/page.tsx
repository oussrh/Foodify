import Link from 'next/link'
import CategoryManager from '@/components/category-manager'
import { getMenu } from '@/app/actions/menu-actions'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChefHat, FolderTree, Plus } from 'lucide-react'

export default async function MenuPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) {
    throw new Error('Not authenticated')
  }
  
  const restaurant = await prisma.restaurant.findFirst({
    where: { id, users: { some: { email: session.user.email } } },
    select: { id: true, name: true },
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  const data = await getMenu(id)
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">
            Manage categories and dishes for {restaurant.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/manager/restaurants/${id}/dishes`}>
              <ChefHat className="h-4 w-4 mr-2" />
              View All Dishes
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/manager/restaurants/${id}/dishes/create`}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dish
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="space-y-4">
          <CategoryManager initialData={data} restaurantId={id} />
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Quick Stats</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Categories: {data.length}<br/>
                Subcategories: {data.reduce((sum, cat) => sum + cat.subcategories.length, 0)}<br/>
                Total Dishes: {data.reduce((sum, cat) => 
                  sum + cat.subcategories.reduce((subSum, sub) => subSum + sub.dishes.length, 0), 0)}
              </p>
            </div>
            
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Quick Actions</h3>
              <div className="mt-2 space-y-2">
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={`/manager/restaurants/${id}/dishes`}>
                    Manage Dishes
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <Link href={`/manager/restaurants/${id}/dishes/create`}>
                    Add New Dish
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">Menu Tips</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Keep your menu organized with clear categories. 
                Use high-quality images and detailed descriptions 
                to make dishes more appealing.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
