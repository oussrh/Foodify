import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import CreateDishForm from '@/components/create-dish-form'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function CreateDishPage({
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
    include: {
      categories: {
        include: {
          subcategories: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!restaurant) {
    redirect('/manager/restaurants')
  }

  // Flatten subcategories for the form
  const subcategories = restaurant.categories.flatMap(category => 
    category.subcategories.map(sub => ({
      id: sub.id,
      nameEn: `${category.nameEn} → ${sub.nameEn}`
    }))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/manager/restaurants/${id}/dishes`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dishes
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Dish</h1>
          <p className="text-muted-foreground">
            Add a new dish to {restaurant.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dish Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateDishForm 
              restaurantId={id} 
              subcategories={subcategories}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips for Great Dishes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">High-Quality Images</h4>
              <p className="text-sm text-muted-foreground">
                Use high-resolution images (at least 1200x800px) with good lighting. 
                Images should showcase the dish clearly and appetizingly.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">AR Assets</h4>
              <p className="text-sm text-muted-foreground">
                USDZ files are for iOS AR viewing, GLB files for Android and web. 
                Ensure your 3D models are optimized and under 10MB for best performance.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Descriptions</h4>
              <p className="text-sm text-muted-foreground">
                Write appetizing descriptions that highlight key ingredients and 
                preparation methods. Include allergen information when relevant.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Pricing</h4>
              <p className="text-sm text-muted-foreground">
                Set competitive prices that reflect the value and quality of your dishes. 
                Consider your target market and local pricing standards.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}